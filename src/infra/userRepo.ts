import { randomUUID } from "crypto";
import { PagedResult } from "./paged.js";

type User = {
  id: string;
  name: string;
  created: Date;
};

type ListUsersFilter = {
  createdRangeStart?: Date;
  createdRangeEnd?: Date;
  search?: string;
  limit: number;
  offset: number;
};

type CreateUserRequest = {
  name: string;
};

class UserRepo {
  private users: User[] = [
    {
      id: "4ab28100-f56d-450d-92be-5f9fec656ccd",
      name: "John Doe",
      created: new Date(),
    },
    {
      id: "a648ea31-d8b8-4311-a638-23e57efdd538",
      name: "Jane Smith",
      created: new Date(),
    },
    {
      id: "c823a11b-a788-4c69-a467-0c42da7ce80d",
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

  async createUser(req: CreateUserRequest): Promise<User> {
    const newUser: User = {
      id: randomUUID(),
      name: req.name,
      created: new Date(),
    };
    this.users.push(newUser);
    return Promise.resolve(newUser);
  }
}

export { UserRepo, type User, type ListUsersFilter };
