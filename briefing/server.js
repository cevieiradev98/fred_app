const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const PORT = process.env.PORT || 4000;
const DATA_DIR = path.join(__dirname, 'data');
const JSON_PATH = path.join(DATA_DIR, 'briefings.json');
const HTML_PATH = path.join(__dirname, 'briefing-ineep.html');

const FIELD_DEFINITIONS = [
    { name: 'responsavel', label: 'Responsável pelo projeto' },
    { name: 'email', label: 'E-mail principal' },
    {
        name: 'missao',
        label: 'Qual a missão/propósito do INEEP que deve transparecer nos conteúdos?'
    },
    { name: 'publico', label: 'Quem é o público-alvo principal dos conteúdos?' },
    { name: 'publico_outro', label: 'Se outro público, especifique' },
    {
        name: 'percepcao',
        label: 'Descreva em 2-3 frases como o INEEP quer ser percebido pelo público'
    },
    { name: 'cores', label: 'Cores da marca' },
    { name: 'manual', label: 'Vocês têm manual de marca/brandbook?' },
    {
        name: 'ref_videos',
        label: 'Referências visuais de vídeos/canais que vocês admiram'
    },
    {
        name: 'ref_feeds',
        label: 'Referências visuais de feeds/perfis que vocês admiram'
    },
    {
        name: 'objetivos',
        label: 'Objetivos gerais dos vídeos (pode marcar mais de um)'
    },
    { name: 'objetivos_outro', label: 'Se outro objetivo, especifique' },
    { name: 'elementos', label: 'Elementos obrigatórios em todos os vídeos' },
    {
        name: 'logo_posicao',
        label: 'Se logo, especifique onde (abertura/encerramento/canto fixo)...'
    },
    { name: 'fornecimento', label: 'Vocês fornecerão para cada vídeo' },
    {
        name: 'fornecimento_outros',
        label: 'Se outros materiais para vídeo, especifique'
    },
    { name: 'objetivo_posts', label: 'Objetivo principal dos posts' },
    { name: 'formatos', label: 'Formatos desejados' },
    { name: 'estilo_posts', label: 'Estilo visual dos posts' },
    { name: 'fornecimento_posts', label: 'Vocês fornecerão para os posts' },
    {
        name: 'evitar',
        label: 'Existem temas, imagens ou abordagens que devem ser EVITADOS?'
    },
    {
        name: 'nao_parecer',
        label: 'Há concorrentes ou referências que NÃO devemos parecer?'
    },
    { name: 'restricoes', label: 'Restrições de linguagem ou termos' },
    {
        name: 'envio',
        label: 'Como será o envio dos roteiros/briefings semanais?'
    },
    { name: 'plataforma', label: 'Se plataforma específica para envio, qual?' },
    { name: 'aprovador', label: 'Quem aprovará os materiais?' },
    {
        name: 'num_aprovadores',
        label: 'Haverá mais alguém no processo de aprovação?'
    },
    {
        name: 'tempo_aprovacao',
        label: 'Tempo máximo de resposta para aprovações'
    },
    {
        name: 'dia_reuniao',
        label: 'Melhor dia da semana para reuniões de alinhamento (se necessário)'
    },
    { name: 'horario', label: 'Melhor horário para reuniões' },
    { name: 'banco_imagens', label: 'Vocês têm banco de imagens próprio?' },
    { name: 'qual_banco', label: 'Se sim, qual banco de imagens?' },
    { name: 'icones', label: 'Vocês têm ilustrações/ícones próprios?' },
    { name: 'trilhas', label: 'Trilhas sonoras' },
    {
        name: 'resultado_excelente',
        label: 'O que seria um resultado EXCELENTE para vocês neste projeto?'
    },
    { name: 'metricas', label: 'Como vocês medirão o sucesso dos conteúdos?' },
    { name: 'metricas_outro', label: 'Se outra métrica, especifique' },
    {
        name: 'observacoes',
        label: 'Algo mais que não foi perguntado mas é importante sabermos?'
    }
];

const FIELD_NAME_SET = new Set(FIELD_DEFINITIONS.map((field) => field.name));

function ensureDataDirectory() {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }
}

function escapeCsvValue(value) {
    if (value === null || value === undefined) {
        return '';
    }

    const normalized = Array.isArray(value) ? value.join('; ') : String(value);
    const escaped = normalized.replace(/"/g, '""');

    return /[",\n]/.test(normalized) ? `"${escaped}"` : escaped;
}

function formatFieldValue(value) {
    if (value === undefined || value === null) {
        return '';
    }

    if (Array.isArray(value)) {
        return value.join('; ');
    }

    if (typeof value === 'string') {
        return value;
    }

    return String(value);
}

function normalizePayload(payload) {
    const unknownFields = Object.keys(payload).filter(
        (key) => !FIELD_NAME_SET.has(key)
    );

    if (unknownFields.length > 0) {
        throw new Error(
            `Campos não mapeados para CSV: ${unknownFields.join(', ')}`
        );
    }

    return FIELD_DEFINITIONS.reduce((accumulator, field) => {
        const value = Object.prototype.hasOwnProperty.call(payload, field.name)
            ? payload[field.name]
            : '';

        accumulator[field.name] = value;
        return accumulator;
    }, {});
}

function generateTimestampedCsvPath() {
    const now = new Date();
    const timestamp = now.toISOString()
        .replace(/:/g, '-')
        .replace(/\..+/, '')
        .replace('T', '_');
    return path.join(DATA_DIR, `briefing_${timestamp}.csv`);
}

function createNewCsv(data) {
    const csvPath = generateTimestampedCsvPath();
    const headerValues = FIELD_DEFINITIONS.map((field) =>
        escapeCsvValue(field.label)
    );
    const rowValues = FIELD_DEFINITIONS.map((field) =>
        escapeCsvValue(formatFieldValue(data[field.name]))
    );
    const headerLine = headerValues.join(',');
    const content = `${headerLine}\n${rowValues.join(',')}\n`;

    fs.writeFileSync(csvPath, content, 'utf8');
    return csvPath;
}

function appendToJson(data) {
    const entry = {
        savedAt: new Date().toISOString(),
        data
    };

    if (!fs.existsSync(JSON_PATH)) {
        fs.writeFileSync(JSON_PATH, JSON.stringify([entry], null, 2), 'utf8');
        return;
    }

    const content = fs.readFileSync(JSON_PATH, 'utf8');
    const payload = content ? JSON.parse(content) : [];

    if (!Array.isArray(payload)) {
        throw new Error('Formato JSON existente inválido.');
    }

    payload.push(entry);
    fs.writeFileSync(JSON_PATH, JSON.stringify(payload, null, 2), 'utf8');
}

function handleBriefingPost(req, res) {
    let rawBody = '';

    req.on('data', (chunk) => {
        rawBody += chunk.toString();
    });

    req.on('end', () => {
        try {
            const payload = rawBody ? JSON.parse(rawBody) : null;

            if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Payload inválido' }));
                return;
            }

            ensureDataDirectory();

            let normalized;

            try {
                normalized = normalizePayload(payload);
            } catch (normalizationError) {
                console.error(
                    'Falha ao normalizar campos. Salvando somente em JSON.',
                    normalizationError
                );
                appendToJson(payload);
                res.writeHead(202, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ message: 'Dados salvos em JSON (campos extras)' }));
                return;
            }

            try {
                const csvPath = createNewCsv(normalized);
                console.log(`Briefing salvo em: ${csvPath}`);
                appendToJson(normalized);
                res.writeHead(204);
                res.end();
            } catch (csvError) {
                console.error('Falha ao salvar CSV, tentando JSON.', csvError);
                appendToJson(normalized);
                res.writeHead(202, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ message: 'Dados salvos em JSON' }));
            }
        } catch (error) {
            console.error('Erro ao processar requisição:', error);
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Conteúdo inválido' }));
        }
    });
}

function serveHtml(res) {
    fs.createReadStream(HTML_PATH)
        .on('open', () => {
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        })
        .on('error', (error) => {
            console.error('Erro ao ler HTML:', error);
            res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end('Erro interno ao carregar a página.');
        })
        .pipe(res);
}

const server = http.createServer((req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`);

    if (req.method === 'POST' && url.pathname === '/api/briefing') {
        handleBriefingPost(req, res);
        return;
    }

    if (req.method === 'GET' && (url.pathname === '/' || url.pathname === '/briefing-ineep.html')) {
        serveHtml(res);
        return;
    }

    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Rota não encontrada.');
});

server.listen(PORT, () => {
    console.log(`Servidor INEEP rodando em http://localhost:${PORT}`);
});
