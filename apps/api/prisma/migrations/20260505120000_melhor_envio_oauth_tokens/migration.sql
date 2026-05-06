-- CreateTable
CREATE TABLE "melhor_envio_oauth_tokens" (
    "id" TEXT NOT NULL,
    "access_token" TEXT NOT NULL,
    "refresh_token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "melhor_envio_oauth_tokens_pkey" PRIMARY KEY ("id")
);
