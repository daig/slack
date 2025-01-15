import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';
import config from '../config';

const httpLink = createHttpLink({
  uri: config.graphqlEndpoint,
  credentials: 'omit', // Changed from 'same-origin' to 'omit'
  headers: {
    'Content-Type': 'application/json',
  }
});

export const client = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-and-network',
    },
  },
}); 