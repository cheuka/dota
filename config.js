/**
 * File managing configuration for the application
 **/
var dotenv = require('dotenv');
dotenv.config(
{
    silent: true
});
dotenv.load();
var defaults = {
    "CHEUKA_ADMIN": "admin", //cheuka admin username
    "CHEUKA_ADMIN_PASSWORD": "password", // cheuka admin password
    "STEAM_API_KEY": "", //for API reqs, in worker
    "STEAM_USER": "", //for getting replay salt/profile data, in retriever
    "STEAM_PASS": "", //make sure to wrap in double quotes in .env if it contains special characters
    "RECAPTCHA_PUBLIC_KEY": "", //for preventing automated requests, in web
    "RECAPTCHA_SECRET_KEY": "",
    "STRIPE_SECRET": "", //for donations, in web
    "STRIPE_PUBLIC": "",
    "BRAIN_TREE_MERCHANT_ID": "",
    "BRAIN_TREE_PUBLIC_KEY": "",
    "BRAIN_TREE_PRIVATE_KEY": "",
    "RETRIEVER_SECRET": "", //string to use as shared secret with retriever/parser
    "SESSION_SECRET": "secret to encrypt cookies with", //string to encrypt cookies
    "ROOT_URL": "http://localhost:5000", //base url to redirect to after steam oauth login
    "WORK_URL": "http://localhost:5400", //url to request work from (for worker nodes)
    "START_SEQ_NUM": "", //truthy: use sequence number stored in redis, else: use approximate value from live API
    "NODE_ENV": "development",
    "FRONTEND_PORT": "5000",
    "RETRIEVER_PORT": "5100",
    "PARSER_PORT": "5200",
    "PROXY_PORT": "5300",
    "WORK_PORT": "5400",
    "SCANNER_PORT": "5500",
    "POSTGRES_URL": "postgresql://postgres:postgres@localhost/yasp", //connection string for PostgreSQL
    "POSTGRES_USER_URL": "postgresql://postgres:postgres@localhost/user_db", //connection for cheuka users
    "REDIS_URL": "redis://127.0.0.1:6379/0", //connection string for Redis
    "CASSANDRA_URL": "cassandra://localhost/yasp", //connection string for Cassandra
    "RETRIEVER_HOST": "localhost:5100", //The host of the retriever (access to Dota 2 GC data)
    "UNTRACK_DAYS": 7, //The number of days a user is tracked for after every visit
    "GOAL": 5, //The cheese goal
    "PROXY_URLS": "", //comma separated list of proxy urls to use
    "STEAM_API_HOST": "api.steampowered.com", //the list of hosts to fetch Steam API data from
    "ROLE": "", //for specifying the file that should be run when deploy.js is invoked
    "MMSTATS_DATA_INTERVAL": 3, //minutes between requests for MMStats data
    "DEFAULT_DELAY": 1000, // delay between API requests (default: 1000)
    "SCANNER_DELAY": 300, //delay for scanner API requests (more time-sensitive)
    "SCANNER_PARALLELISM": 1, //Number of simultaneous API requests to make in scanner
    "PLAYER_MATCH_LIMIT": 50000, //max results to return from player matches
    "BENCHMARK_RETENTION_HOURS": 1, //hours in block to retain benchmark data for percentile
    "MATCH_RATING_RETENTION_HOURS": 12, //hours in block to retain match rating data for percentile
    "ABILITY_UPGRADE_RETENTION_HOURS": 12, //hours to retain match ability upgrade data
    "PROVIDER": "", //The cloud provider used by the application (determines how environment data is downloaded)
    "UI_HOST": "", //The host of the UI, redirect traffic from / and /return here
    "ENABLE_RECAPTCHA": "", //set to enable the recaptcha on the Request page
    "ENABLE_ADS": "", //set to turn on ads
    "ENABLE_PRO_PARSING": "", // set to parse pro matches from sequential API
    "ENABLE_MATCH_CACHE": "", // set to enable caching matches (Redis)
    "ENABLE_PLAYER_CACHE": "", // set to enable caching players (Cassandra)
    "ENABLE_INSERT_ALL_MATCHES": "", //set to enable inserting all matches
    "ENABLE_RANDOM_MMR_UPDATE": "", //set to randomly update MMRs in ranked matches
    "ENABLE_POSTGRES_MATCH_STORE_WRITE": "1", //set to enable writing match data to postgres (default on)
    "ENABLE_CASSANDRA_MATCH_STORE_READ": "", //set to enable reading match data from cassandra
    "ENABLE_CASSANDRA_MATCH_STORE_WRITE": "", //set to enable writing match data to cassandra
};
//ensure that process.env has all values in defaults, but prefer the process.env value
for (var key in defaults)
{
    process.env[key] = (key in process.env) ? process.env[key] : defaults[key];
}
if (process.env.NODE_ENV === "development")
{
    //force PORT to null in development so we can run multiple web services without conflict
    process.env.PORT = "";
}
//now processes can use either process.env or config
module.exports = process.env;
