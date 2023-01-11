export const db = {
  async getAgency(agencyId: number) {
    return Promise.resolve({
      agencyId,
    })
  },
}
