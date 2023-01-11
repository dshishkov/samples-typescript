# Temporal PRR Workflow

This is an advanced sample that requires knowledge of SDK internals. There's a lot going on "behind the scenes" in [`subscriptions.ts`](./src/workflows/subscriptions.ts).
It is far simpler to manually publish updates from Workflow code but we put the sample here to show off some of the advanced capabilities provided by the runtime.

### Running this sample

1. Make sure Temporal Server is running locally (see the [quick install guide](https://docs.temporal.io/server/quick-install/)).
1. `npm install` to install dependencies.
1. `npm run worker` to start the Worker.
1. `npm run client.watch` to start the Client in another shell. Comment/Uncomment section of `clientSignal.ts` to simulate changes of status while the PRR workflow is executing
1. Go to http://localhost:8080/namespaces/default/workflows/prrWorkflowAgency123 to see details about the workflow once it begins to execute

