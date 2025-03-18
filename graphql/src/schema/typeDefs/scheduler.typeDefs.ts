import gql from "graphql-tag";

// Type Definitions
export const schedulerTypeDefs = gql`
  enum ServiceType {
    user
    notification
    recommendation
    order
  }

  type SchedulerData {
    # This is a flexible field that can contain any JSON data
    key: String
    value: String
  }

  type SchedulerTask {
    id: ID!
    taskName: String!
    serviceType: ServiceType!
    cronExpression: String!
    enabled: Boolean!
    lastRun: String
    nextRun: String
    data: JSON
    createdAt: String!
    updatedAt: String!
  }

  input SchedulerTaskInput {
    taskName: String!
    serviceType: ServiceType!
    cronExpression: String!
    enabled: Boolean
    data: JSON
  }

  input SchedulerTaskUpdateInput {
    taskName: String
    serviceType: ServiceType
    cronExpression: String
    enabled: Boolean
    data: JSON
  }

  # Define a custom scalar for JSON data
  scalar JSON

  type Query {
    # Get all scheduler tasks
    schedulerTasks: [SchedulerTask!]!

    # Get a specific scheduler task by ID
    schedulerTask(id: ID!): SchedulerTask

    # Get tasks by service type
    schedulerTasksByService(serviceType: ServiceType!): [SchedulerTask!]!
  }

  type Mutation {
    # Create a new scheduler task
    createSchedulerTask(input: SchedulerTaskInput!): SchedulerTask!

    # Update an existing scheduler task
    updateSchedulerTask(
      id: ID!
      input: SchedulerTaskUpdateInput!
    ): SchedulerTask!

    # Delete a scheduler task
    deleteSchedulerTask(id: ID!): Boolean!

    # Enable or disable a scheduler task
    toggleSchedulerTask(id: ID!, enabled: Boolean!): SchedulerTask!
  }
`;
