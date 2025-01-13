import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';
import config from '../config';

const httpLink = createHttpLink({
  uri: 'http://13.48.45.64:5000/graphql',
  credentials: 'include', // This enables sending cookies if needed
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