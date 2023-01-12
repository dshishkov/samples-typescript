import { Client } from '@temporalio/client'
import { PRRWokrflow, setPRRState } from './workflows'

async function run() {
  const client = new Client()
  const agencyId = 123
  // meaningful id for us, so that we can retrieve workflow at a later point in time in code
  const workflowId = `prrWorkflowAgency${agencyId}`

  // Workflow could be started by an automated backend process or a manual user input
  // Either schedule a new workflow or signal an existing one

  await client.workflow.signalWithStart(PRRWokrflow, {
    workflowId,
    taskQueue: 'prrWorkflowTaskQueue',
    args: [{ agencyId, type: 'PO' }],
    signal: setPRRState,
    signalArgs: [{ status: 'started' }],
  })

  // Stop the workflow but do not abort (more like a pause). If restarted, we will resume from the next PRR step when the workflow was last in status started.
  // This happens when we receive for example communication (email, phone call) from the agency as part of sending PRR emails.

  // await client.workflow.signalWithStart(PRRWokrflow,{
  //   workflowId,
  //   taskQueue: 'prrWorkflowTaskQueue',
  //   args: [{ agencyId, type: 'PO' }],
  //   signal: setPRRState,
  //   signalArgs: [{ status: 'stopped' }]
  // })

  // Abort the workflow, this will end the workflow execution and complete the workflow

  // await client.workflow.signalWithStart(PRRWokrflow,{
  //   workflowId,
  //   taskQueue: 'prrWorkflowTaskQueue',
  //   args: [{ agencyId, type: 'PO' }],
  //   signal: setPRRState,
  //   signalArgs: [{ status: 'abort' }]
  // })
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
