import { handleOptions, json } from "../../vercel/api-data.js";

export default function handler(req, res) {
  if (handleOptions(req, res)) {
    return;
  }

  if (req.method !== "GET") {
    json(res, 405, { error: "method_not_allowed" });
    return;
  }

  json(res, 409, {
    error: "local_party_requires_local_api",
    message: "Admin access only works against the local Radium API."
  });
}
