# project-name

Monorepo structure containing Web, Mobile, and API applications.

## Structure
- `apps/web`: React JS (Vite)
- `apps/mobile`: React Native (Expo or CLI)
- `apps/api`: Node.js + Express backend
- `packages/shared`: Shared constants, validators, types
- `docker/`: Docker configuration
- `docs/`: Documentation

## Web and API deployment

The web app uses the API for account registration/sign-in, students, and departments. Departments and student records are stored in MySQL and owned by the authenticated account. Create an account from the sign-in page; each account starts with an empty department list.

Before starting the Docker deployment, create an untracked `.env` file in the repository root with unique secrets:

```dotenv
DB_ROOT_PASSWORD=replace-with-a-unique-mysql-root-password
DB_USER=etam_app
DB_PASSWORD=replace-with-a-unique-application-database-password
JWT_SECRET=replace-with-a-long-random-secret
```

Use different secrets in each hosted environment, and make `JWT_SECRET` at least 32 random characters. Keep `.env` private and do not commit it. The database and API ports are private to the Docker network; the web service is exposed on port 80. Put an HTTPS reverse proxy in front of it for production. Start the services with:

```sh
docker compose up --build
```

The API waits for MySQL, applies pending migrations on startup, and then starts listening. The web container serves the portal at `http://localhost` and proxies API requests through Nginx. Migrations add account ownership to student records and create the account-scoped departments table. Existing student rows from before account ownership are retained with no owner and are not exposed to newly registered accounts.

For direct API development outside Docker, set `JWT_SECRET` to a long random value and run the API migration command before the API:

```sh
npm run db:migrate --workspace=apps/api
npm run dev:api
```
