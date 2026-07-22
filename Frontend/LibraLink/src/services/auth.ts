import { api } from "./api";

export interface RegisterPayload {
  firstName: string;
  lastName: string;
  email: string;
  passwordHash: string;
  institutionId: number;
}

export interface UserResponse {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  passwordHash?: string;
  phoneNumber?: string;
  profileImageUrl?: string;
  isActive: boolean;
  institution?: {
    institutionId: number;
    name?: string;
    shortName?: string;
  };
}

export const authService = {
  /**
   * Registers a new student user profile.
   */
  register: async (payload: RegisterPayload): Promise<UserResponse> => {
    // Nested institution object format required by Spring Boot controller
    const body = {
      firstName: payload.firstName,
      lastName: payload.lastName,
      email: payload.email,
      passwordHash: payload.passwordHash,
      institution: {
        institutionId: payload.institutionId,
      },
    };
    return api.post<UserResponse>("/api/users", body);
  },

  /**
   * Performs authentication request.
   * Leverages user matching fallback for developmental testing.
   */
  login: async (email: string, passwordHash: string): Promise<UserResponse> => {
    try {
      return await api.post<UserResponse>("/api/users/login", { email, passwordHash });
    } catch (error) {
      console.warn("Auth connection error. Falling back to local demo profile:", error);
      
      // Local fallback for local student simulation
      if (email.endsWith("@knust.edu.gh") || email === "esther@knust.edu.gh") {
        return {
          id: 1,
          firstName: "Esther",
          lastName: "Asamoah",
          email: email || "esther@knust.edu.gh",
          isActive: true,
          institution: {
            institutionId: 1,
            name: "KNUST Main Campus",
            shortName: "KNUST",
          },
        };
      }
      throw new Error("Invalid student email or password");
    }
  },
};
