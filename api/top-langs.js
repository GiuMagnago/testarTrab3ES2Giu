import { renderTopLanguages } from "../src/cards/top-languages-card.js";
import { blacklist } from "../src/common/blacklist.js";
import {
  clampValue,
  CONSTANTS,
  parseArray,
  parseBoolean,
  renderError,
} from "../src/common/utils.js";
import { fetchTopLanguages } from "../src/fetchers/top-languages-fetcher.js";
import { isLocaleAvailable } from "../src/translations.js";

export default async (req, res) => {
  const {
    username,
    hide,
    hide_title,
    hide_border,
    card_width,
    title_color,
    text_color,
    bg_color,
    theme,
    cache_seconds,
    layout,
    langs_count,
    exclude_repo,
    size_weight,
    count_weight,
    custom_title,
    locale,
    border_radius,
    border_color,
    disable_animations,
    hide_progress,
  } = req.query;

  // Define o cabeçalho como HTML
  res.setHeader("Content-Type", "text/html");

  if (blacklist.includes(username)) {
    return res.send(
      `<html><body>${renderError(
        "Something went wrong",
        "This username is blacklisted", 
        {
          title_color,
          text_color,
          bg_color,
          border_color,
          theme,
        })}</body></html>`
    );
  }

  if (locale && !isLocaleAvailable(locale)) {
    return res.send(`<html><body>${renderError("Something went wrong", "Locale not found")}</body></html>`);
  }

  if (
    layout !== undefined &&
    (typeof layout !== "string" ||
      !["compact", "normal", "donut", "donut-vertical", "pie"].includes(layout))
  ) {
    return res.send(`<html><body>${renderError("Something went wrong", "Incorrect layout input")}</body></html>`);
  }

  try {
    const topLangs = await fetchTopLanguages(
      username,
      parseArray(exclude_repo),
      size_weight,
      count_weight,
    );

    let cacheSeconds = clampValue(
      parseInt(cache_seconds || CONSTANTS.CARD_CACHE_SECONDS, 10),
      CONSTANTS.SIX_HOURS,
      CONSTANTS.ONE_DAY,
    );
    cacheSeconds = process.env.CACHE_SECONDS
      ? parseInt(process.env.CACHE_SECONDS, 10) || cacheSeconds
      : cacheSeconds;

    res.setHeader(
      "Cache-Control",
      `max-age=${
        cacheSeconds / 2
      }, s-maxage=${cacheSeconds}, stale-while-revalidate=${CONSTANTS.ONE_DAY}`,
    );

    // Retorna o SVG dentro de uma estrutura HTML
    return res.send(`
      <html>
        <body>
          <div>
            ${renderTopLanguages(topLangs, {
              custom_title,
              hide_title: parseBoolean(hide_title),
              hide_border: parseBoolean(hide_border),
              card_width: parseInt(card_width, 10),
              hide: parseArray(hide),
              title_color,
              text_color,
              bg_color,
              theme,
              layout,
              langs_count,
              border_radius,
              border_color,
              locale: locale ? locale.toLowerCase() : null,
              disable_animations: parseBoolean(disable_animations),
              hide_progress: parseBoolean(hide_progress),
            })}

            <!-- Adiciona o drop-down para selecionar caixa alta ou caixa baixa -->
            <label for="caseSelector">Escolha o formato do título:</label>
            <select id="caseSelector">
              <option value="uppercase">Caixa Alta</option>
              <option value="lowercase">Caixa Baixa</option>
            </select>
          </div>

          <!-- Script para manipular o SVG -->
          <script>
            // Função para atualizar o título do langcard
            function atualizarTextoCaixa() {
              // Seleciona o SVG
              const svg = document.querySelector('svg'); // Assume que o SVG é o único na página
                
              // Seleciona o elemento <text> que representa o título (assumindo que é o primeiro elemento <text>)
              const titulo = svg.querySelector('text'); // Você pode ajustar o seletor se necessário
                
              // Verifica a seleção do drop-down (caixa alta ou caixa baixa)
              const caseOption = document.getElementById('caseSelector').value;

              // Atualiza o título de acordo com a seleção
              if (caseOption === 'uppercase') {
                titulo.textContent = titulo.textContent.toUpperCase();
              } else if (caseOption === 'lowercase') {
                titulo.textContent = titulo.textContent.toLowerCase();
              }
            }

            // Adiciona o evento de mudança ao drop-down
            document.getElementById('caseSelector').addEventListener('change', atualizarTextoCaixa);
          </script>
        </body>
      </html>
    `);
  } catch (err) {
    res.setHeader(
      "Cache-Control",
      `max-age=${CONSTANTS.ERROR_CACHE_SECONDS / 2}, s-maxage=${
        CONSTANTS.ERROR_CACHE_SECONDS
      }, stale-while-revalidate=${CONSTANTS.ONE_DAY}`,
    );

    // Retorna o erro também dentro de uma estrutura HTML
    return res.send(`
      <html>
        <body>
          ${renderError(err.message, err.secondaryMessage, {
            title_color,
            text_color,
            bg_color,
            border_color,
            theme,
          })}
        </body>
      </html>
    `);
  }
};
