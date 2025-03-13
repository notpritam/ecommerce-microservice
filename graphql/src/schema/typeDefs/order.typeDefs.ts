import gql from "graphql-tag";

export const orderTypeDefs = gql`
  enum OrderStatus {
    pending
    processing
    shipped
    delivered
    cancelled
  }

  type OrderItem {
    productId: ID!
    quantity: Int!
    price: Float!
  }

  type StatusHistory {
    status: OrderStatus!
    timestamp: Date!
    note: String
  }

  type Order {
    id: ID!
    userId: ID!
    orderItems: [OrderItem!]!
    totalAmount: Float!
    status: OrderStatus!
    statusHistory: [StatusHistory!]!
    shippingAddress: JSON!
    paymentMethod: String!
    createdAt: Date!
    updatedAt: Date!
  }

  input OrderItemInput {
    productId: ID!
    quantity: Int!
    price: Float!
  }

  input StatusHistoryInput {
    status: OrderStatus!
    timestamp: Date
    note: String
  }

  input ShippingAddressInput {
    street: String!
    city: String!
    state: String!
    zipCode: String!
    country: String!
  }

  input CreateOrderInput {
    userId: ID!
    orderItems: [OrderItemInput!]!
    totalAmount: Float!
    status: OrderStatus
    statusHistory: [StatusHistoryInput!]
    shippingAddress: ShippingAddressInput!
    paymentMethod: String!
  }

  input UpdateOrderInput {
    status: OrderStatus
    statusHistory: StatusHistoryInput
    shippingAddress: ShippingAddressInput
  }

  type Query {
    getOrder(id: ID!): Order
    getOrdersByUser(userId: ID!): [Order!]!
    getOrdersByStatus(status: OrderStatus!): [Order!]!
    getAllOrders(limit: Int, offset: Int): [Order!]!
  }

  type Mutation {
    createOrder(input: CreateOrderInput!): Order!
    updateOrderStatus(id: ID!, status: OrderStatus!, note: String): Order!
    cancelOrder(id: ID!, note: String): Order!
  }

  # Define scalar types needed
  scalar Date
  scalar JSON
`;
