#!/usr/bin/env bash

print_help() {
	echo "Usage: $(basename "$0") [COMMAND] [OPTIONS] [ARGS...]"
	echo ""
	echo "COMMANDS:"
	echo "  up          Create and start containers (default)"
	echo "    --build                Rebuild images before starting"
	echo "    -d, --detach           Run containers in the background"
	echo "    --no-deps              Don't start linked services"
	echo "    --remove-orphans       Remove containers for services not in compose file"
	echo "    --force-recreate       Recreate containers even if config hasn't changed"
	echo "  down        Stop and remove containers, networks"
	echo "  logs        View container logs"
	echo "  start       Start existing containers"
	echo "    --no-deps              Don't start linked services"
	echo ""
	echo "  stop        Stop running containers without removing them"
	echo ""
	echo "  exec        Execute a command in a running container"
	echo "    -i                     Keep STDIN open even if not attached"
	echo "    -t                     Allocate a pseudo-TTY"
	echo ""
	echo "GLOBAL OPTIONS:"
	echo "  --dev                  Use development environment"
	echo "  --prod                 Use production environment (default)"
	echo "  -h, --help             Show this help message"
	echo "  --                     Pass all following args to docker compose"
	echo ""
	echo "EXAMPLES:"
	echo "  $(basename "$0") up --dev                           # Start dev environment"
	echo "  $(basename "$0") up --prod --build                  # Build and start production"
	echo "  $(basename "$0") up -d                              # Start in background"
	echo "  $(basename "$0") exec -i -t web sh                  # Interactive shell in web"
	echo "  $(basename "$0") up -- --scale web=3                # Pass args to docker compose"
}

fatal() {
	echo "$(basename "$0"): Error: $1" >&2
	exit 1
}

execute_command() {
	local command=$1
	local mode=$2
	shift 2
	
	local compose_file="docker-compose.yml"
	local env_file=".env"
	local project_name="danberosite"

	if [[ $mode == "dev" ]]; then
		compose_file="docker-compose.dev.yml"
		env_file=".env.dev"
		project_name="danberosite_dev"
	fi

	local branch
	branch=$(git branch --show-current 2>/dev/null | tr '[:upper:]' '[:lower:]')
	[[ -n $branch ]] && project_name="${project_name}_${branch}_branch"

	exec docker compose \
		--file "$compose_file" \
		--env-file "$env_file" \
		--project-name "$project_name" \
		"$command" "$@"

}

expand_flags() {
	local after_separator=false
	
	for arg in "$@"; do
		if [[ $after_separator == true ]]; then
			printf "%s " "$arg"
			continue
		fi
		
		if [[ $arg == "--" ]]; then
			after_separator=true
			printf "%s " "$arg"
			continue
		fi
		
		if [[ $arg == -* && $arg != --* && ${#arg} -gt 2 ]]; then
			local chars="${arg#-}"
			local i
			for ((i=0; i < ${#chars}; i++)); do
				printf "%s " "-${chars:$i:1}"
			done
		else
			printf "%s " "$arg"
		fi
	done
}

is_command() {
	case $1 in
	up|down|start|stop|logs|exec|cp)
		return 0
		;;
	*)
		return 1
		;;
	esac
}

is_global_flag() {
	case $1 in
	-h|--help|--dev|--prod)
		return 0
		;;
	*)
		return 1
		;;
	esac
}

is_command_flag() {
	case $1 in
	-t|--tty|-i|--interactive|-d|--detach|--no-deps|--remove-orphans|--force-recreate|--build)
		return 0
		;;
	*)
		return 1
		;;
	esac
}

main() {
	[[ $# -eq 0 ]] && set -- "up"

	set -- $(expand_flags "$@")

	local command="up"
	local mode="prod"
	local docker_args=()
	local found_command=false
	local has_explicit_command=false

	for arg in "$@"; do
		[[ $arg == "--" ]] && break
		if is_command "$arg"; then
			has_explicit_command=true
			break
		fi
	done

	if [[ $has_explicit_command == false ]]; then
		found_command=true
	fi
	
	while [[ $# -gt 0 ]]; do
		case "$1" in
			--)
				shift
				docker_args+=("$@")
				break
				;;
			-h|--help)
				print_help
				exit 0
				;;
			--dev|--prod)
				mode="${1#--}"
				shift
				continue
		esac

		if [[ $found_command == false ]]; then
			if is_command "$1"; then
				command=$1
				found_command=true
			elif [[ $1 == -* ]]; then
				if ! is_global_flag "$1"; then
					fatal "Unknown global flag before command: '$1'. Use --help for usage."
				fi
			else
				fatal "Unknown command or misplaced argument before command: '$1'. Use --help for usage."
			fi
		else
			if is_command_flag "$1"; then
				docker_args+=("$1")
			elif [[ $1 == -* ]]; then
				fatal "Unknown flag after command: '$1'. Use --help for usage."
			else
				docker_args+=("$1")
			fi
		fi
		shift
	done
	
	execute_command "$command" "$mode" "${docker_args[@]}"
}

main "$@"