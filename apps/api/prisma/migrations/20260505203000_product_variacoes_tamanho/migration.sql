-- Tamanhos de roupa por modelo (lista JSON de strings).
ALTER TABLE "CompositeProduct" ADD COLUMN "variacoes_tamanho" JSONB NOT NULL DEFAULT '[]'::jsonb;

UPDATE "CompositeProduct"
SET "variacoes_tamanho" = '["P","M","G","GG","XG"]'::jsonb
WHERE jsonb_array_length(COALESCE("variacoes_tamanho", '[]'::jsonb)) = 0;
