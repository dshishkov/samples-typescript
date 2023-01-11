import { Context } from '@temporalio/activity'
import { setTimeout as promiseTimeout } from 'timers/promises'
import { db } from './util'
import { type PRRParams } from './types'

export async function sendFirstEmail({
  agencyId,
  type,
}: PRRParams): Promise<Record<string, any>> {
  const cancelSignal = Context.current().cancellationSignal

  if(Context.current().info.attempt === 1) {
    throw new Error('I always fail the first time I try to go')
  }

  // do some async/external work (hit db/external API) that could fail and needs to retry
  const agency = await db.getAgency(agencyId)
  // send heartbeat so that we can detect the workflow being canceled
  Context.current().heartbeat()
  if (cancelSignal.aborted) {
    console.log('I got canceled while doing stuff, I am going home.')
    return { canceled: true }
  }

  console.log('Sending first PRR Email', new Date(), agency, type)
  return agency
}

export async function sendSecondEmail({
  agencyId,
  type,
}: PRRParams): Promise<Record<string, any>> {
  // do some async/external work (hit db, external API) that could fail and needs to retry
  const agency = await db.getAgency(agencyId)
  await promiseTimeout(1000)
  console.log('Sending second PRR Email', new Date(), agency, type)
  return agency
}

export async function noResponseTask({
  agencyId,
  type,
}: PRRParams): Promise<Record<string, any>> {
  // do some async/external work (hit db, external API) that could fail and needs to retry
  const agency = await db.getAgency(agencyId)
  await promiseTimeout(1000)
  console.log('Creating no-response task', new Date(), agency, type)
  return agency
}

export async function getNextSendDate({
  agencyId,
  type,
}: PRRParams): Promise<number> {
  // do some async/external work (hit db, external API) that could fail and needs to retry
  const agency = await db.getAgency(agencyId)
  await promiseTimeout(1000)
  const nextSendDate = new Date()
  console.log('getNextSendDate', new Date(), { agency, type, nextSendDate })
  return nextSendDate.getTime() + 10000 // simulate a date slightly in the future
}
