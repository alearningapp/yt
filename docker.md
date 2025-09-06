# Pull the latest PostgreSQL image
docker pull postgres

# Run PostgreSQL container
docker run --name my-postgres \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_USER=postgresql \
  -e POSTGRES_DB=helpyt \
  -p 5432:5432 \
  -d postgres


  #DATABASE_URL="postgresql://postgres:password@localhost:5432/helpyt"
npm run db:push
