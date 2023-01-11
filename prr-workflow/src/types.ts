export type statusType = 'started' | 'stopped' | 'abort'
export type stepType = 'firstEmail' | 'secondEmail' | 'noResponseTask'

export interface PRRState {
  status: statusType
  nextStep: stepType
  // Date in ms since epoch
  nextSendDate: number
  nextSendDateUpdated: boolean
  iterations: number
}

export interface PRRParams {
  agencyId: number
  type: 'PO' | 'Contacts'
  initialState?: PRRState
}
