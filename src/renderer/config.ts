interface Config {
  graphqlEndpoint: string;
}

declare global {
  interface Window {
    env: {
      GRAPHQL_ENDPOINT: string;
    }
  }
}

const config: Config = {
  graphqlEndpoint: window.env.GRAPHQL_ENDPOINT || 'http://localhost:5000/graphql',
};

export default config;