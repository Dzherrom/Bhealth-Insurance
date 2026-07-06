#!/usr/bin/env python3
"""Investigación roles/JWT/CRUD — Lumina CRM."""
from __future__ import annotations

import base64
import json
import os
import sys
import urllib.error
import urllib.request
from typing import Any

API_BASE = os.environ.get("API_BASE", "http://127.0.0.1:8000/api")
USERNAME = os.environ.get("QA_USERNAME", "lumina-admin")
PASSWORD = os.environ.get("QA_PASSWORD", "ChangeMeInProduction!")


def decode_jwt(token: str) -> dict[str, Any]:
    payload = token.split(".")[1]
    payload += "=" * ((4 - len(payload) % 4) % 4)
    return json.loads(base64.urlsafe_b64decode(payload))


def request(
    method: str,
    url: str,
    *,
    token: str | None = None,
    body: dict | None = None,
) -> tuple[int, Any]:
    data = None
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    if body is not None:
        data = json.dumps(body).encode()
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            raw = resp.read().decode()
            try:
                return resp.status, json.loads(raw) if raw else {}
            except json.JSONDecodeError:
                return resp.status, raw
    except urllib.error.HTTPError as exc:
        raw = exc.read().decode()
        try:
            parsed = json.loads(raw) if raw else {}
        except json.JSONDecodeError:
            parsed = raw
        return exc.code, parsed


def main() -> int:
    print(f"=== Investigación API ({API_BASE}) ===")
    print(f"Usuario: {USERNAME}")

    status, login = request(
        "POST",
        f"{API_BASE}/login/",
        body={"username": USERNAME, "password": PASSWORD},
    )
    print(f"\n[login] status={status}")
    if status != 200:
        print("BODY:", login)
        return 1

    access = login["access"]
    refresh = login["refresh"]
    role_resp = login.get("role")
    jwt_payload = decode_jwt(access)
    print(f"  role (response): {role_resp}")
    print(f"  role (jwt): {jwt_payload.get('role')}")
    print(f"  exp in {round((jwt_payload.get('exp', 0) - jwt_payload.get('iat', 0)) / 60)} min")

    status, profile = request("GET", f"{API_BASE}/profile/", token=access)
    print(f"\n[profile] status={status}")
    if status == 200:
        prof = profile.get("profile", {})
        print(f"  profile.role: {prof.get('role')}")
        print(f"  profile.status: {prof.get('status')}")

    status, polizas = request("GET", f"{API_BASE}/polizas/?page_size=1", token=access)
    print(f"\n[polizas] status={status}")
    rows = polizas.get("results") if isinstance(polizas, dict) else polizas
    if not isinstance(rows, list):
        rows = []
    if not rows:
        print("  WARN: sin pólizas para probar CRUD")
        poliza_id = None
    else:
        poliza_id = rows[0]["id"]
        print(f"  poliza_id={poliza_id}")

    results: list[tuple[str, int, Any]] = []

    if poliza_id:
        s, body = request(
            "POST",
            f"{API_BASE}/carpetas-documentos/",
            token=access,
            body={"poliza": poliza_id, "nombre": "QA Investigacion Carpeta"},
        )
        results.append(("carpeta_create", s, body))
        print(f"\n[carpeta_create] status={s}")
        print(" ", body)

        s, body = request(
            "POST",
            f"{API_BASE}/recordatorios/",
            token=access,
            body={
                "poliza": poliza_id,
                "tipo": "OTRO",
                "motivo": "QA test",
                "fecha_vencimiento": "07/15/2026",
                "hora_vencimiento": "10:00:00",
            },
        )
        results.append(("recordatorio_create", s, body))
        print(f"\n[recordatorio_create] status={s}")
        print(" ", body)

        s, body = request(
            "POST",
            f"{API_BASE}/citas/",
            token=access,
            body={
                "poliza": poliza_id,
                "fecha_hora": "07/15/2026 10:00:00",
                "proveedor": "Dr QA",
                "lugar": "Clinica QA",
                "estado": "PROGRAMADA",
            },
        )
        results.append(("cita_create", s, body))
        print(f"\n[cita_create] status={s}")
        print(" ", body)

    s, body = request(
        "POST",
        f"{API_BASE}/login/refresh/",
        body={"refresh": refresh},
    )
    results.append(("refresh", s, body))
    print(f"\n[refresh] status={s}")
    if s == 200:
        print("  new access role:", decode_jwt(body["access"]).get("role"))
    else:
        print(" ", body)

    # Double refresh with OLD token (race simulation)
    s2, body2 = request("POST", f"{API_BASE}/login/refresh/", body={"refresh": refresh})
    print(f"\n[refresh_race_old_token] status={s2}")
    print(" ", body2)

    print("\n=== RESUMEN ===")
    for name, code, _ in results:
        ok = code in (200, 201)
        print(f"  {name}: {code} {'OK' if ok else 'FAIL'}")

    return 0


if __name__ == "__main__":
    sys.exit(main())
