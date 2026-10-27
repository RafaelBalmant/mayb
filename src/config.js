// Constantes do app que não são texto do site (os textos ficam em data/conteudo.json).

/** Chave do sessionStorage; mude o sufixo quando o formato salvo deixar de ser compatível. */
export const STORAGE_KEY = "site-mayara:v2";

/** Quantidade de etapas da barra de progresso. */
export const TOTAL_STEPS = 8;

/** Valores da escala de incômodo. */
export const INTENSITY_SCALE = [1, 2, 3, 4, 5];

/** Tamanho máximo do nome na mensagem do WhatsApp. */
export const NAME_MAX_LENGTH = 60;

/**
 * Encurtamento dos textos livres quando a mensagem passa do limite:
 * começa em `start` caracteres e vai diminuindo `step` por vez até `min`.
 */
export const FREE_TEXT_SHRINK = { start: 200, step: 20, min: 20 };

/** Início do link de conversa do WhatsApp. */
export const WHATSAPP_BASE_URL = "https://wa.me/";

/** Quanto tempo o aviso do mapa fica visível (ms). */
export const NOTICE_DURATION_MS = 1400;

/** Espera antes de ir para a tela "enviado", para o link do WhatsApp abrir primeiro (ms). */
export const SEND_REDIRECT_DELAY_MS = 300;
