import ApiService from "@/services/api";

class FleetService {
  async all(userId, planetId) {
    const response = await ApiService.get(
      `/loadfleet?user=${userId}&planetid=${planetId}`
    );

    return response;
  }
}

export default new FleetService();
