import { User } from "./userRepo.js";

class TokenRepo {
  async generateUserIdToken(user: User): Promise<string> {
    return `token-for-user-${user.id}`;
  }
}

export { TokenRepo };
