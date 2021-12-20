export const schema = gql`
  # Keep in sync with StatusEnum in starknet/contracts/profile.cairo
  enum StatusEnum {
    NOT_CHALLENGED
    CHALLENGED
    ADJUDICATION_ROUND_COMPLETED
    APPEALED
    APPEAL_OPPORTUNITY_EXPIRED
    SUPER_ADJUDICATION_ROUND_COMPLETED
    SETTLED
  }

  type CachedProfile {
    id: ID!
    ethereumAddress: ID!
    status: StatusEnum!
    CID: String!
    photoCID: String
    videoCID: String
    submissionTimestamp: DateTime!
  }

  type PageInfo {
    endCursor: ID!
    hasNextPage: Boolean!
  }

  type CachedProfileEdge {
    cursor: ID!
    node: CachedProfile!
  }

  type CachedProfileConnection {
    id: ID! # This makes apollo-client happy
    edges: [CachedProfileEdge]
    pageInfo: PageInfo
    count: Int!
  }

  type Query {
    cachedProfiles(first: Int!, cursor: ID = 0): CachedProfileConnection
      @skipAuth

    cachedProfile(ethereumAddress: ID!): CachedProfile @skipAuth
  }
`
