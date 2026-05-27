import json
import sys


def is_vec3(value):
    return (
        isinstance(value, list)
        and len(value) == 3
        and all(isinstance(x, (int, float)) for x in value)
    )


def validate_wall_create(cmd):
    errors = []

    if cmd.get("cmd") != "wall.create":
        errors.append("cmd must be wall.create")

    if not is_vec3(cmd.get("start")):
        errors.append("start must be [x, y, z]")

    if not is_vec3(cmd.get("end")):
        errors.append("end must be [x, y, z]")

    if cmd.get("start") == cmd.get("end"):
        errors.append("wall start and end cannot be the same")

    if not isinstance(cmd.get("height"), (int, float)) or cmd.get("height") <= 0:
        errors.append("height must be positive number")

    if not isinstance(cmd.get("thickness"), (int, float)) or cmd.get("thickness") <= 0:
        errors.append("thickness must be positive number")

    return errors


def main():
    if len(sys.argv) != 2:
        print("Usage: python3 scripts/validate_command.py command.json")
        sys.exit(1)

    with open(sys.argv[1], "r") as f:
        cmd = json.load(f)

    if cmd.get("cmd") == "wall.create":
        errors = validate_wall_create(cmd)
    else:
        errors = [f"Unsupported command: {cmd.get('cmd')}"]

    if errors:
        print("INVALID")
        for error in errors:
            print(f"- {error}")
        sys.exit(1)

    print("VALID")


if __name__ == "__main__":
    main()
