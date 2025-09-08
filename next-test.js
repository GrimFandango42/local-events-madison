module.exports = { async headers() { return process.env.NODE_ENV !== "production" ? [{ source: "/(.*)", headers: [{ key: "X-Frame-Options", value: "" }] }] : []; } };
