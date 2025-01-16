import { ApolloClient, InMemoryCache, createHttpLink, split } from '@apollo/client';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { getMainDefinition } from '@apollo/client/utilities';
import { createClient } from 'graphql-ws';
import config from '../config';

// Create an HTTP link for queries and mutations
const httpLink = createHttpLink({
  uri: config.graphqlEndpoint,
  credentials: 'omit',
  headers: {
    'Content-Type': 'application/json',
  }
});

// Create a WebSocket link for subscriptions
const wsLink = new GraphQLWsLink(createClient({
  url: config.graphqlEndpoint.replace('http', 'ws'),
  connectionParams: {
    // Add any authentication parameters here if needed
  },
}));

// Split links based on operation type
const splitLink = split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    return (
      definition.kind === 'OperationDefinition' &&
      definition.operation === 'subscription'
    );
  },
  wsLink,
  httpLink
);

export const client = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-and-network',
    },
  },
}); 