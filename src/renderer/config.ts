const GRAPHQL_ENDPOINT = process.env.REACT_APP_GRAPHQL_ENDPOINT || 'http://localhost:5001/graphql';

const config = {
    graphqlEndpoint: GRAPHQL_ENDPOINT,
};

export default config;