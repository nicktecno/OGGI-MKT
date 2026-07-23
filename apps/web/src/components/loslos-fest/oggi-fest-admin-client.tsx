"use client";

import Image from "next/image";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { festModelImageUrl, LOSLOS_LINE_IMAGE } from "@/lib/loslos-fest/brand";
import {
  HOME_IMAGE_DEFAULTS,
  newLineId,
  newStoreId,
  newTemplateId,
  slugify,
  type AdminCatalog,
} from "@/lib/loslos-fest/admin-catalog-storage";
import type { FestTemplate, HomeSlide, IceCreamLine, LoslosStore } from "@/lib/loslos-fest/types";
import { Pencil, Plus, Trash2 } from "lucide-react";
import {
  LoslosFestAdminToolbar,
  useLoslosFestAdminPersist,
} from "@/components/loslos-fest/loslos-fest-admin-shell";

const OCCASIONS: FestTemplate["occasion"][] = [
  "aniversario",
  "casamento",
  "corporativo",
  "churrasco",
  "infantil",
];

export function LoslosFestLinhasAdminPage() {
  const { catalog, persist, saved } = useLoslosFestAdminPersist();
  return (
    <div className="space-y-6">
      <LoslosFestAdminToolbar catalog={catalog} saved={saved} />
      <LinesTab catalog={catalog} onSave={persist} />
    </div>
  );
}

export function LoslosFestModelosAdminPage() {
  const { catalog, persist, saved } = useLoslosFestAdminPersist();
  return (
    <div className="space-y-6">
      <LoslosFestAdminToolbar catalog={catalog} saved={saved} />
      <TemplatesTab catalog={catalog} onSave={persist} />
    </div>
  );
}

export function LoslosFestFiliaisAdminPage() {
  const { catalog, persist, saved } = useLoslosFestAdminPersist();
  return (
    <div className="space-y-6">
      <LoslosFestAdminToolbar catalog={catalog} saved={saved} />
      <StoresTab catalog={catalog} onSave={persist} />
    </div>
  );
}

export function LoslosFestImagensAdminPage() {
  const { catalog, persist, saved } = useLoslosFestAdminPersist();
  return (
    <div className="space-y-6">
      <LoslosFestAdminToolbar catalog={catalog} saved={saved} />
      <HomeImagesTab catalog={catalog} onSave={persist} />
    </div>
  );
}

function LinesTab({
  catalog,
  onSave,
}: {
  catalog: AdminCatalog;
  onSave: (c: AdminCatalog) => void;
}) {
  const [editing, setEditing] = useState<IceCreamLine | null>(null);
  const [form, setForm] = useState(emptyLineForm());
  const [tagsInput, setTagsInput] = useState("");

  function emptyLineForm(): {
    name: string;
    description: string;
    unitPrice: number;
    imageUrl: string;
  } {
    return {
      name: "",
      description: "",
      unitPrice: 3.5,
      imageUrl: LOSLOS_LINE_IMAGE.classicos,
    };
  }

  function startNew() {
    setEditing(null);
    setForm(emptyLineForm());
    setTagsInput("");
  }

  function startEdit(line: IceCreamLine) {
    setEditing(line);
    setForm({
      name: line.name,
      description: line.description,
      unitPrice: line.unitPrice,
      imageUrl: line.imageUrl,
    });
    setTagsInput(line.tags.join(", "));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const name = form.name.trim();
    if (!name) return;
    const slug = editing?.slug ?? slugify(name);
    const line: IceCreamLine = {
      id: editing?.id ?? newLineId(),
      slug,
      name,
      description: form.description.trim(),
      unitPrice: Number(form.unitPrice) || 0,
      imageUrl: form.imageUrl.trim() || LOSLOS_LINE_IMAGE.classicos,
      tags: tagsInput.split(",").map((t) => t.trim()).filter(Boolean),
      type: editing?.type ?? "palitos",
    };
    const lines = editing
      ? catalog.lines.map((l) => (l.id === editing.id ? line : l))
      : [...catalog.lines, line];
    onSave({ ...catalog, lines });
    startNew();
  }

  function remove(id: string) {
    if (!confirm("Remover esta linha? Modelos que a usam precisarão ser ajustados.")) return;
    onSave({
      ...catalog,
      lines: catalog.lines.filter((l) => l.id !== id),
      templates: catalog.templates.map((t) => ({
        ...t,
        lines: t.lines.filter((l) => l.lineId !== id),
      })),
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Linhas cadastradas</CardTitle>
            <CardDescription>Aparecem na vitrine e no montador de carrinho.</CardDescription>
          </div>
          <Button type="button" size="sm" onClick={startNew}>
            <Plus className="mr-1 h-4 w-4" />
            Nova linha
          </Button>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {catalog.lines.map((line) => (
              <li
                key={line.id}
                className="flex items-center gap-3 rounded-xl border-2 border-primary/10 bg-card p-3"
              >
                <div className="relative h-14 w-14 shrink-0 rounded-lg bg-muted">
                  <Image src={line.imageUrl} alt="" fill className="object-contain p-0.5" sizes="56px" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-primary">{line.name}</p>
                  <p className="text-xs text-muted-foreground">
                    R$ {line.unitPrice.toFixed(2)}/un. · {line.slug}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button type="button" variant="outline" size="icon" onClick={() => startEdit(line)} aria-label="Editar">
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button type="button" variant="outline" size="icon" onClick={() => remove(line.id)} aria-label="Excluir">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card className="h-fit border-primary/20">
        <CardHeader>
          <CardTitle className="text-base">{editing ? "Editar linha" : "Nova linha"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="line-name">Nome</Label>
              <Input id="line-name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="line-desc">Descrição</Label>
              <Input id="line-desc" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="line-price">Preço médio (R$/un.)</Label>
              <Input
                id="line-price"
                type="number"
                step="0.1"
                min="0"
                value={form.unitPrice}
                onChange={(e) => setForm((f) => ({ ...f, unitPrice: Number(e.target.value) }))}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="line-img">URL da imagem</Label>
              <Input id="line-img" value={form.imageUrl} onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="line-tags">Tags (vírgula)</Label>
              <Input id="line-tags" value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} />
            </div>
            <Button type="submit" className="w-full">
              {editing ? "Salvar alterações" : "Adicionar linha"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function TemplatesTab({
  catalog,
  onSave,
}: {
  catalog: AdminCatalog;
  onSave: (c: AdminCatalog) => void;
}) {
  const [editing, setEditing] = useState<FestTemplate | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [occasion, setOccasion] = useState<FestTemplate["occasion"]>("aniversario");
  const [featured, setFeatured] = useState(false);
  const [lineRows, setLineRows] = useState<{ lineId: string; percent: number }[]>([]);

  function resetForm() {
    setEditing(null);
    setName("");
    setDescription("");
    setOccasion("aniversario");
    setFeatured(false);
    setLineRows(catalog.lines.slice(0, 3).map((l, i) => ({ lineId: l.id, percent: i === 0 ? 50 : 25 })));
  }

  function startEdit(t: FestTemplate) {
    setEditing(t);
    setName(t.name);
    setDescription(t.description);
    setOccasion(t.occasion);
    setFeatured(!!t.featured);
    setLineRows(t.lines.map((l) => ({ ...l })));
  }

  function addLineRow() {
    const first = catalog.lines[0];
    if (!first) return;
    setLineRows((rows) => [...rows, { lineId: first.id, percent: 0 }]);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const n = name.trim();
    if (!n || lineRows.length === 0) return;
    const sum = lineRows.reduce((s, r) => s + r.percent, 0);
    if (sum !== 100) {
      alert(`A soma dos percentuais deve ser 100% (atual: ${sum}%).`);
      return;
    }
    const slug = editing?.slug ?? slugify(n);
    const tpl: FestTemplate = {
      id: editing?.id ?? newTemplateId(),
      slug,
      name: n,
      description: description.trim(),
      occasion,
      featured,
      imageUrl: festModelImageUrl(occasion, slug),
      lines: lineRows,
    };
    const templates = editing
      ? catalog.templates.map((t) => (t.id === editing.id ? tpl : t))
      : [...catalog.templates, tpl];
    onSave({ ...catalog, templates });
    resetForm();
  }

  function remove(id: string) {
    if (!confirm("Remover este modelo?")) return;
    onSave({ ...catalog, templates: catalog.templates.filter((t) => t.id !== id) });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Modelos</CardTitle>
            <CardDescription>Composição percentual por linha (soma = 100%).</CardDescription>
          </div>
          <Button type="button" size="sm" onClick={resetForm}>
            <Plus className="mr-1 h-4 w-4" />
            Novo modelo
          </Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {catalog.templates.map((t) => (
            <div key={t.id} className="flex items-start justify-between gap-3 rounded-xl border-2 border-primary/10 p-3">
              <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-lg bg-muted">
                <Image
                  src={t.imageUrl}
                  alt=""
                  fill
                  className="object-cover object-center"
                  sizes="80px"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-primary">
                  {t.name}
                  {t.featured ? (
                    <span className="ml-2 rounded-full bg-[#ffc72c] px-2 py-0.5 text-[0.65rem] font-bold uppercase">
                      Destaque
                    </span>
                  ) : null}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {t.lines.map((l) => {
                    const meta = catalog.lines.find((x) => x.id === l.lineId);
                    return `${meta?.name ?? l.lineId} ${l.percent}%`;
                  }).join(" · ")}
                </p>
              </div>
              <div className="flex shrink-0 gap-1">
                <Button type="button" variant="outline" size="icon" onClick={() => startEdit(t)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button type="button" variant="outline" size="icon" onClick={() => remove(t.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="h-fit border-primary/20">
        <CardHeader>
          <CardTitle className="text-base">{editing ? "Editar modelo" : "Novo modelo"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-3">
            <div className="space-y-1">
              <Label>Nome</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="space-y-1">
              <Label>Descrição</Label>
              <Input value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Ocasião</Label>
              <select
                className="flex h-12 w-full rounded-xl border-2 border-primary/15 bg-card px-3 text-sm"
                value={occasion}
                onChange={(e) => setOccasion(e.target.value as FestTemplate["occasion"])}
              >
                {OCCASIONS.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} />
              Destaque na vitrine
            </label>
            <div className="space-y-2 border-t border-border/60 pt-3">
              <div className="flex items-center justify-between">
                <Label>Linhas (%)</Label>
                <Button type="button" variant="ghost" size="sm" onClick={addLineRow}>
                  + linha
                </Button>
              </div>
              {lineRows.map((row, i) => (
                <div key={i} className="flex gap-2">
                  <select
                    className="min-w-0 flex-1 rounded-lg border border-border px-2 py-2 text-sm"
                    value={row.lineId}
                    onChange={(e) =>
                      setLineRows((rows) => rows.map((r, j) => (j === i ? { ...r, lineId: e.target.value } : r)))
                    }
                  >
                    {catalog.lines.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.name}
                      </option>
                    ))}
                  </select>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    className="w-20"
                    value={row.percent}
                    onChange={(e) =>
                      setLineRows((rows) =>
                        rows.map((r, j) => (j === i ? { ...r, percent: Number(e.target.value) } : r)),
                      )
                    }
                  />
                  <span className="self-center text-sm text-muted-foreground">%</span>
                </div>
              ))}
              <p className="text-xs text-muted-foreground">
                Total: {lineRows.reduce((s, r) => s + r.percent, 0)}% (deve ser 100%)
              </p>
            </div>
            <Button type="submit" className="w-full">
              {editing ? "Salvar modelo" : "Criar modelo"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function StoresTab({
  catalog,
  onSave,
}: {
  catalog: AdminCatalog;
  onSave: (c: AdminCatalog) => void;
}) {
  const [editing, setEditing] = useState<LoslosStore | null>(null);
  const [form, setForm] = useState(emptyStore());

  function emptyStore(): Omit<LoslosStore, "id"> & { id?: string } {
    return { name: "", address: "", city: "", uf: "", cep: "", phone: "" };
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const store: LoslosStore = {
      id: editing?.id ?? newStoreId(),
      name: form.name.trim(),
      address: form.address.trim(),
      city: form.city.trim(),
      uf: form.uf.trim().toUpperCase().slice(0, 2),
      cep: form.cep.trim(),
      phone: form.phone.trim(),
    };
    if (!store.name || !store.city) return;
    const stores = editing
      ? catalog.stores.map((s) => (s.id === editing.id ? store : s))
      : [...catalog.stores, store];
    onSave({ ...catalog, stores });
    setEditing(null);
    setForm(emptyStore());
  }

  function remove(id: string) {
    if (!confirm("Remover esta filial?")) return;
    onSave({ ...catalog, stores: catalog.stores.filter((s) => s.id !== id) });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Filiais para retirada do carrinho</CardTitle>
            <CardDescription>Exibidas no checkout quando o cliente escolhe retirar na loja.</CardDescription>
          </div>
          <Button
            type="button"
            size="sm"
            onClick={() => {
              setEditing(null);
              setForm(emptyStore());
            }}
          >
            <Plus className="mr-1 h-4 w-4" />
            Nova filial
          </Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {catalog.stores.map((s) => (
            <div key={s.id} className="flex justify-between gap-3 rounded-xl border-2 border-primary/10 p-3">
              <div>
                <p className="font-semibold">{s.name}</p>
                <p className="text-xs text-muted-foreground">
                  {s.address} — {s.city}/{s.uf} · CEP {s.cep}
                </p>
                <p className="text-xs text-muted-foreground">{s.phone}</p>
              </div>
              <div className="flex shrink-0 gap-1">
                <Button type="button" variant="outline" size="icon" onClick={() => { setEditing(s); setForm({ ...s }); }}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button type="button" variant="outline" size="icon" onClick={() => remove(s.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="h-fit border-primary/20">
        <CardHeader>
          <CardTitle className="text-base">{editing ? "Editar filial" : "Nova filial"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-3">
            {(["name", "address", "city", "uf", "cep", "phone"] as const).map((field) => (
              <div key={field} className="space-y-1">
                <Label className="capitalize">{field === "uf" ? "UF" : field === "cep" ? "CEP" : field === "name" ? "Nome da loja" : field}</Label>
                <Input
                  value={form[field]}
                  onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
                  required={field === "name" || field === "city"}
                />
              </div>
            ))}
            <Button type="submit" className="w-full">
              {editing ? "Salvar filial" : "Adicionar filial"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function HomeImagesTab({
  catalog,
  onSave,
}: {
  catalog: AdminCatalog;
  onSave: (c: AdminCatalog) => void;
}) {
  const slides = catalog.homeImages?.heroSlides ?? [];

  function updateSlides(next: HomeSlide[]) {
    onSave({ ...catalog, homeImages: { ...catalog.homeImages, heroSlides: next } });
  }

  function updateSlide(index: number, patch: Partial<HomeSlide>) {
    updateSlides(slides.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  }

  function addSlide() {
    updateSlides([...slides, { src: "", alt: "" }]);
  }

  function removeSlide(index: number) {
    if (!confirm("Remover este slide do carrossel da home?")) return;
    updateSlides(slides.filter((_, i) => i !== index));
  }

  function move(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= slides.length) return;
    const next = [...slides];
    [next[index], next[target]] = [next[target], next[index]];
    updateSlides(next);
  }

  function restoreDefaults() {
    if (!confirm("Restaurar os slides padrão da home?")) return;
    updateSlides(HOME_IMAGE_DEFAULTS.heroSlides.map((s) => ({ ...s })));
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Imagens da home</CardTitle>
          <CardDescription>
            Carrossel do topo da página inicial. As alterações aparecem na vitrine ao salvar.
          </CardDescription>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={restoreDefaults}>
            Restaurar padrão
          </Button>
          <Button type="button" size="sm" onClick={addSlide}>
            <Plus className="mr-1 h-4 w-4" />
            Novo slide
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {slides.length === 0 ? (
          <p className="rounded-xl border-2 border-dashed border-primary/20 p-6 text-center text-sm text-muted-foreground">
            Nenhum slide. Adicione ao menos um para o carrossel da home.
          </p>
        ) : null}
        {slides.map((slide, i) => (
          <div
            key={i}
            className="flex flex-col gap-3 rounded-xl border-2 border-primary/10 bg-card p-3 sm:flex-row"
          >
            <div className="relative h-24 w-full shrink-0 overflow-hidden rounded-lg bg-muted sm:w-40">
              {slide.src ? (
                <Image src={slide.src} alt={slide.alt || ""} fill className="object-cover" sizes="160px" />
              ) : (
                <span className="flex h-full items-center justify-center text-xs text-muted-foreground">
                  Sem imagem
                </span>
              )}
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <div className="space-y-1">
                <Label htmlFor={`slide-src-${i}`}>URL da imagem</Label>
                <Input
                  id={`slide-src-${i}`}
                  value={slide.src}
                  placeholder="/loslos/carousel-01.png ou https://…"
                  onChange={(e) => updateSlide(i, { src: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor={`slide-alt-${i}`}>Descrição (alt)</Label>
                <Input
                  id={`slide-alt-${i}`}
                  value={slide.alt}
                  placeholder="Los Los Fest — evento"
                  onChange={(e) => updateSlide(i, { alt: e.target.value })}
                />
              </div>
            </div>
            <div className="flex shrink-0 gap-1 sm:flex-col">
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label="Mover para cima"
                disabled={i === 0}
                onClick={() => move(i, -1)}
              >
                ↑
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label="Mover para baixo"
                disabled={i === slides.length - 1}
                onClick={() => move(i, 1)}
              >
                ↓
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label="Remover slide"
                onClick={() => removeSlide(i)}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </div>
        ))}
        <p className="text-xs text-muted-foreground">
          Dica: use imagens locais em <code>/public/loslos/…</code> ou uma URL externa. Proporção
          recomendada 16:9.
        </p>
      </CardContent>
    </Card>
  );
}
