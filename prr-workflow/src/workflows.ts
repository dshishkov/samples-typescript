import {
  condition,
  proxyActivities,
  defineSignal,
  defineQuery,
  setHandler,
  continueAsNew,
} from '@temporalio/workflow'
import * as activities from './activities'
import { type PRRParams, PRRState } from './types'

const { sendFirstEmail, sendSecondEmail, noResponseTask, getNextSendDate } =
  // settings for all activities in the workflow
  proxyActivities<typeof activities>({
    // max duration of an activity attempt once it is started before a timeout
    startToCloseTimeout: '60 seconds',
    // if an activity doesn't report a heartbeat in this timeframe,
    // the workflow will reschedule it for execution (important when a worker processing
    // the activity dies unexpectedly, and we need to schedule the activity as soon as possible to try again)
    heartbeatTimeout: '3s',
    retry: {
      maximumAttempts: 10,
    },
  })

// Cap iterations in a single workflow execution to this so that the event history size is manageable.
// If reached, we spawn a new workflow of the same kind and pass the same parameters which starts with a clean sheet
const MAX_ITERATIONS = 50

// Workflow Signal to mutate workflow state
export const setPRRState = defineSignal<[Partial<PRRState>]>('setPRRState')
// Workflow Query to get workflow state
export const getPRRState = defineQuery<PRRState>('getPRRState')

// Workflow definition
export async function PRRWokrflow({
  agencyId,
  type,
  initialState,
}: PRRParams): Promise<void> {
  const state: PRRState = {
    iterations: 0,
    status: initialState?.status ?? 'stopped',
    nextStep: initialState?.nextStep ?? 'firstEmail',
    nextSendDate: initialState?.nextSendDate ?? 0,
    // used internally in workflow to re-evaluate suspend time when we are waiting to send first PRR email
    nextSendDateUpdated: false,
  }

  console.log('PRR Workflow Started')

  // Something/someone external is sending a signal
  // (a person started or aborted automation, we got a new file or a file for this agency got parsed/imported, we got a call/email from the agency contact)
  // so we adjust the workflow's state as needed
  setHandler(setPRRState, (newState) => {
    Object.assign(state, newState)
    state.nextSendDateUpdated = true
  })
  // allow external world to get workflow state
  setHandler(getPRRState, () => state)

  // We loop until we get a signal that changes the status to abort or the workflow's cancel API is used externally
  while (state.status !== 'abort') {
    // indefinitely suspend until we are in either of the statuses
    console.log('I am waiting for abort/start status')
    await condition(() => ['abort', 'started'].includes(state.status))

    // suspend until the next send date is elapsed and
    // re-evaluate the wait time when we get a signal that modifies the workflow state
    while (state.status === 'started' && state.nextStep === 'firstEmail') {
      state.nextSendDate = await getNextSendDate({ agencyId, type })
      state.nextSendDateUpdated = false
      console.log('I am waiting for the next send date', state.nextSendDate)
      const isNextSendElapsed = !(await condition(
        () => state.nextSendDateUpdated,
        state.nextSendDate - Date.now()
      ))
      // will only be true if the above condition hit its timeout clause
      if (isNextSendElapsed) {
        break
      }
    }

    // execute first activity and update workflow state
    if (state.status === 'started' && state.nextStep === 'firstEmail') {
      await sendFirstEmail({ agencyId, type })
      state.nextStep = 'secondEmail'
    }

    // will suspend until we hit the timeout threshold or the predicate becomes true (we are either not started or this is no longer the next step)
    await condition(
      () => !(state.status === 'started' && state.nextStep === 'secondEmail'),
      '10 seconds'
    )
    // execute second activity
    if (state.status === 'started' && state.nextStep === 'secondEmail') {
      await sendSecondEmail({ agencyId, type })
      state.nextStep = 'noResponseTask'
    }

    // will suspend until we hit the timeout threshold or the predicate becomes true (we are either not started or this is no longer the next step)
    await condition(
      () =>
        !(state.status === 'started' && state.nextStep === 'noResponseTask'),
      '5 seconds'
    )
    // execute final activity, update state to suspend on next iteration but not exit loop
    if (state.status === 'started' && state.nextStep === 'noResponseTask') {
      await noResponseTask({ agencyId, type })
      state.nextStep = 'firstEmail'
      state.status = 'stopped'
    }

    // check if we should maybe start a new workflow instance if we need to keep looping
    state.iterations++
    if (state.iterations >= MAX_ITERATIONS) {
      await continueAsNew<typeof PRRWokrflow>({
        type,
        agencyId,
        initialState: {
          ...state,
          iterations: 0,
        },
      })
      break
    }
  }

  console.log('PRR Workflow Completed')
}
