import { randomUUID } from "crypto";
import { PagedResult } from "./paged.js";

type User = {
  id: string;
  email: string;
  password: string | null; // Just for demonstration...
  name: string;
  created: Date;
};

type ListUsersFilter = {
  createdRangeStart?: Date;
  createdRangeEnd?: Date;
  email?: string;
  search?: string;
  limit: number;
  offset: number;
};

type CreateUserRequest = {
  email: string;
  password: string | null;
  name: string;
};

class UserRepo {
  private users: User[] = [
    {
      id: "4ab28100-f56d-450d-92be-5f9fec656ccd",
      email: "johndoe@example.com",
      password: null,
      name: "John Doe",
      created: new Date(),
    },
    {
      id: "a648ea31-d8b8-4311-a638-23e57efdd538",
      email: "janesmith@example.com",
      password: "5678",
      name: "Jane Smith",
      created: new Date(),
    },
    {
      id: "c823a11b-a788-4c69-a467-0c42da7ce80d",
      email: "alicejohnson@test.test",
      password: null,
      name: "Alice Johnson",
      created: new Date(),
    },
  ];

  async getUser(id: string): Promise<User | undefined> {
    return this.users.find((user) => user.id === id);
  }

  async listUsers(filter: ListUsersFilter): Promise<PagedResult<User>> {
    let filteredUsers = this.users;

    if (filter.createdRangeStart) {
      filteredUsers = filteredUsers.filter(
        (user) => user.created >= filter.createdRangeStart!
      );
    }

    if (filter.createdRangeEnd) {
      filteredUsers = filteredUsers.filter(
        (user) => user.created <= filter.createdRangeEnd!
      );
    }

    if (filter.search) {
      const searchLower = filter.search.toLowerCase();
      filteredUsers = filteredUsers.filter((user) =>
        user.name.toLowerCase().includes(searchLower)
      );
    }

    if (filter.email) {
      const emailLower = filter.email.toLowerCase();
      filteredUsers = filteredUsers.filter(
        (user) => user.email.toLowerCase() === emailLower
      );
    }

    const pagedUsers = filteredUsers.slice(
      filter.offset,
      filter.offset + filter.limit
    );

    return {
      data: pagedUsers,
      limit: filter.limit,
      offset: filter.offset,
    };
  }

  async createUser(
    req: CreateUserRequest
  ): Promise<
    | { success: true; user: User }
    | { success: false; error: "EMAIL_ALREADY_EXISTS" }
  > {
    const newUser: User = {
      id: randomUUID(),
      email: req.email,
      password: req.password,
      name: req.name,
      created: new Date(),
    };
    const existingUser = this.users.find((user) => user.email === req.email);
    if (existingUser) {
      return Promise.resolve({ success: false, error: "EMAIL_ALREADY_EXISTS" });
    }
    this.users.push(newUser);
    return Promise.resolve({ success: true, user: newUser });
  }

  async countUsers(): Promise<number> {
    return this.users.length;
  }

  async signInUser(email: string, password: string): Promise<User | null> {
    const user = this.users.find(
      (u) => u.email === email && u.password === password
    );
    return user || null;
  }
}

export { UserRepo, type User, type ListUsersFilter };
