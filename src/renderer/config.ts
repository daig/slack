// Ensure we have a default endpoint even if environment variables aren't loaded
const GRAPHQL_ENDPOINT = (typeof process !== 'undefined' && process.env && process.env.REACT_APP_GRAPHQL_ENDPOINT) 
    ? process.env.REACT_APP_GRAPHQL_ENDPOINT 
    : 'http://localhost:5000/graphql';

const config = {
    graphqlEndpoint: GRAPHQL_ENDPOINT,
};

export default config;