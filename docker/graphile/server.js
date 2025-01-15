const express = require("express");
const { postgraphile } = require("postgraphile");
const cors = require("cors");
const app = express();

// Enable CORS for all routes
app.use(cors({
    origin: "*",
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    preflightContinue: false,
    optionsSuccessStatus: 204
}));

// PostGraphile middleware
app.use(
    postgraphile(
        process.env.DATABASE_URL,
        "public",
        {
            watchPg: true,
            graphiql: true,
            enhanceGraphiql: true,
            dynamicJson: true,
            setofFunctionsContainNulls: false,
            legacyRelations: "omit",
            appendPlugins: [require("postgraphile-plugin-connection-filter")],
            showErrorStack: true,
        }
    )
);

const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
}); 