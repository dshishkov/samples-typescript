# Temporal PRR Workflow

Temporal flow will go through PRR email 1/2 and no response task creation and then stop. Flow can be restarted/resumed by an external signal from another service or user.
If we get an abort status the Workflow completes and exits.

### Running this sample

1. Make sure Temporal Server is running locally (see the [quick install guide](https://docs.temporal.io/server/quick-install/)).
1. `npm install` to install dependencies.
1. `npm run worker` to start the Worker.
1. `npm run client.watch` to start the Client in another shell. Comment/Uncomment section of `clientSignal.ts` to simulate changes of status while the PRR workflow is executing
1. Go to http://localhost:8080/namespaces/default/workflows/prrWorkflowAgency123 to see details about the workflow once it begins to execute

