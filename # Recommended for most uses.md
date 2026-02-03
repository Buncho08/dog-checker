# Recommended for most uses
DATABASE_URL=postgresql://neondb_owner:npg_5NQDHM3ApFSK@ep-little-dew-a14w7736-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require

# For uses requiring a connection without pgbouncer
DATABASE_URL_UNPOOLED=postgresql://neondb_owner:npg_5NQDHM3ApFSK@ep-little-dew-a14w7736.ap-southeast-1.aws.neon.tech/neondb?sslmode=require

# Parameters for constructing your own connection string
PGHOST=ep-little-dew-a14w7736-pooler.ap-southeast-1.aws.neon.tech
PGHOST_UNPOOLED=ep-little-dew-a14w7736.ap-southeast-1.aws.neon.tech
PGUSER=neondb_owner
PGDATABASE=neondb
PGPASSWORD=npg_5NQDHM3ApFSK

# Parameters for Vercel Postgres Templates
POSTGRES_URL=postgresql://neondb_owner:npg_5NQDHM3ApFSK@ep-little-dew-a14w7736-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
POSTGRES_URL_NON_POOLING=postgresql://neondb_owner:npg_5NQDHM3ApFSK@ep-little-dew-a14w7736.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
POSTGRES_USER=neondb_owner
POSTGRES_HOST=ep-little-dew-a14w7736-pooler.ap-southeast-1.aws.neon.tech
POSTGRES_PASSWORD=npg_5NQDHM3ApFSK
POSTGRES_DATABASE=neondb
POSTGRES_URL_NO_SSL=postgresql://neondb_owner:npg_5NQDHM3ApFSK@ep-little-dew-a14w7736-pooler.ap-southeast-1.aws.neon.tech/neondb
POSTGRES_PRISMA_URL=postgresql://neondb_owner:npg_5NQDHM3ApFSK@ep-little-dew-a14w7736-pooler.ap-southeast-1.aws.neon.tech/neondb?connect_timeout=15&sslmode=require

psql "postgresql://neondb_owner:npg_5NQDHM3ApFSK@ep-little-dew-a14w7736-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"