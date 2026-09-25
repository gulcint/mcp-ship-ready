def handle_missing_resource():
    # Deprecated resource-not-found code (2026-07-28 spec renumbers this to -32602).
    return {"code": -32002, "message": "resource not found"}


def register_client(metadata):
    # OAuth Dynamic Client Registration (RFC 7591), deprecated in favor of CIMD.
    return post_to_authorization_server(endpoint="registration_endpoint", body=metadata)
