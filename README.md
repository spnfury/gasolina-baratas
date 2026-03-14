# RadarGas Blog

Blog de noticias sobre precios de gasolina y diésel en España, construido con **Next.js** y **NocoDB** como CMS headless.

## Setup

```bash
npm install
```

Crea un archivo `.env.local` con las variables de NocoDB:

```env
NOCODB_API_URL=https://tu-nocodb.example.com
NOCODB_API_TOKEN=tu_token_aqui
NOCODB_BLOG_TABLE_ID=tu_table_id
```

## Estructura de la tabla NocoDB

| Campo        | Tipo       | Descripción                        |
|--------------|------------|-------------------------------------|
| Title        | Text       | Título del artículo                 |
| Slug         | Text       | URL amigable (ej: `mi-articulo`)    |
| Excerpt      | Text       | Resumen corto                       |
| Content      | LongText   | Contenido en Markdown               |
| CoverImage   | URL        | URL de la imagen de portada         |
| Category     | SingleSelect | `Precios`, `Consejos`, `Análisis`, `Regulación` |
| Published    | Checkbox   | Marcar para publicar                |
| PublishedAt  | DateTime   | Fecha de publicación                |

## Dev

```bash
npm run dev
```

## Deploy

Conectar el repo a **Vercel** y configurar las variables de entorno.
