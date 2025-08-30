import { randomUUID } from "crypto";
import { PagedResult } from "./paged.js";

type Message = {
  id: string;
  from: string;
  to: string;
  message: string;
  created: Date;
};

type ListMessagesFilter = {
  userContextFilter?: string;
  createdRangeStart?: Date;
  createdRangeEnd?: Date;
  from?: string;
  to?: string;
  search?: string;
  limit: number;
  offset: number;
};

type CreateMessageRequest = {
  from: string;
  to: string;
  message: string;
};

class MessageRepo {
  private messages: Map<string, Message> = new Map<string, Message>();

  async createMessage(req: CreateMessageRequest): Promise<Message> {
    const newMessage: Message = {
      id: randomUUID(),
      from: req.from,
      to: req.to,
      message: req.message,
      created: new Date(),
    };
    this.messages.set(newMessage.id, newMessage);
    return newMessage;
  }

  async getMessage(id: string): Promise<Message | undefined> {
    return this.messages.get(id);
  }

  async listMessages(
    filter: ListMessagesFilter
  ): Promise<PagedResult<Message>> {
    let filteredMessages = Array.from(this.messages.values());

    if (filter.userContextFilter) {
      // Only show messages where the user is either the sender or recipient
      filteredMessages = filteredMessages.filter(
        (msg) =>
          msg.from === filter.userContextFilter ||
          msg.to === filter.userContextFilter
      );
    }

    if (filter.createdRangeStart) {
      filteredMessages = filteredMessages.filter(
        (msg) => msg.created >= filter.createdRangeStart!
      );
    }

    if (filter.createdRangeEnd) {
      filteredMessages = filteredMessages.filter(
        (msg) => msg.created <= filter.createdRangeEnd!
      );
    }

    if (filter.from) {
      filteredMessages = filteredMessages.filter(
        (msg) => msg.from === filter.from
      );
    }

    if (filter.to) {
      filteredMessages = filteredMessages.filter((msg) => msg.to === filter.to);
    }

    if (filter.search) {
      filteredMessages = filteredMessages.filter((msg) =>
        msg.message.toLowerCase().includes(filter.search!.toLowerCase())
      );
    }

    const pagedMessages = filteredMessages.slice(
      filter.offset,
      filter.offset + filter.limit
    );

    return {
      data: pagedMessages,
      limit: filter.limit,
      offset: filter.offset,
    };
  }
}

export { MessageRepo, type Message, type ListMessagesFilter };
