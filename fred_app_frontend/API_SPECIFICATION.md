# API REST - Especificação para Fred Care

Esta documentação especifica os endpoints que a API backend deve implementar para substituir o Supabase.

## Base URL
```
http://localhost:3001/api
```

## Endpoints

### Routine Items

#### GET `/routine-items`
Buscar itens de rotina por data
- **Query Parameters:**
  - `date` (string, optional): Data no formato YYYY-MM-DD (default: hoje)
  - `sort` (string, optional): Campo para ordenação (ex: "period")

- **Response:**
```json
[
  {
    "id": "string",
    "period": "morning" | "afternoon" | "evening",
    "task": "string",
    "completed": boolean,
    "completed_at": "string | null",
    "date": "string"
  }
]
```

#### POST `/routine-items`
Criar novo item de rotina
- **Body:**
```json
{
  "period": "morning" | "afternoon" | "evening",
  "task": "string",
  "date": "string" // opcional, default: hoje
}
```

#### PATCH `/routine-items/:id`
Atualizar item de rotina
- **Body:**
```json
{
  "completed": boolean,
  "completed_at": "string | null"
}
```

#### DELETE `/routine-items/:id`
Deletar item de rotina

### Glucose Readings

#### GET `/glucose-readings`
Buscar leituras de glicemia
- **Query Parameters:**
  - `limit` (number, optional): Número máximo de registros (default: 30)
  - `sort` (string, optional): Ordenação (ex: "created_at:desc")

- **Response:**
```json
[
  {
    "id": "string",
    "value": number,
    "time_of_day": "string",
    "protocol": "string",
    "notes": "string",
    "date": "string",
    "created_at": "string"
  }
]
```

#### POST `/glucose-readings`
Criar nova leitura de glicemia
- **Body:**
```json
{
  "value": number,
  "time_of_day": "string",
  "protocol": "string", // opcional
  "notes": "string", // opcional
  "date": "string" // opcional, default: hoje
}
```

#### DELETE `/glucose-readings/:id`
Deletar leitura de glicemia

### Mood Entries

#### GET `/mood-entries`
Buscar registros de humor
- **Query Parameters:**
  - `limit` (number, optional): Número máximo de registros (default: 30)
  - `sort` (string, optional): Ordenação (ex: "created_at:desc")

- **Response:**
```json
[
  {
    "id": "string",
    "energy_level": "alta" | "media" | "baixa",
    "general_mood": ["string"],
    "appetite": "alto" | "normal" | "baixo" | "nao-comeu",
    "walk": "longo" | "curto" | "nao-passeou",
    "notes": "string",
    "date": "string",
    "created_at": "string"
  }
]
```

#### POST `/mood-entries`
Criar novo registro de humor
- **Body:**
```json
{
  "energy_level": "alta" | "media" | "baixa",
  "general_mood": ["string"],
  "appetite": "alto" | "normal" | "baixo" | "nao-comeu",
  "walk": "longo" | "curto" | "nao-passeou",
  "notes": "string", // opcional
  "date": "string" // opcional, default: hoje
}
```

#### DELETE `/mood-entries/:id`
Deletar registro de humor

## Estrutura de Resposta de Erro

```json
{
  "error": "string",
  "message": "string",
  "statusCode": number
}
```

## Headers Esperados

- `Content-Type: application/json`
- `Accept: application/json`

## Notas Importantes

1. Todos os endpoints devem retornar JSON
2. IDs devem ser strings únicas
3. Datas devem estar no formato ISO 8601
4. O frontend assume que a API retorna os dados diretamente (sem wrapper do tipo `{ data: ... }`)
5. Erros HTTP devem usar códigos de status apropriados (400, 404, 500, etc.)
