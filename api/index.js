import { renderStatsCard } from "../src/cards/stats-card.js";
import { blacklist } from "../src/common/blacklist.js";
import {
  clampValue,
  CONSTANTS,
  parseArray,
  parseBoolean,
  renderError,
} from "../src/common/utils.js";
import { fetchStats } from "../src/fetchers/stats-fetcher.js";
import { isLocaleAvailable } from "../src/translations.js";

export default async (req, res) => {
  const {
    username,
    hide,
    hide_title,
    hide_border,
    card_width,
    hide_rank,
    show_icons,
    include_all_commits,
    line_height,
    title_color,
    ring_color,
    icon_color,
    text_color,
    text_bold,
    bg_color,
    theme,
    cache_seconds,
    exclude_repo,
    custom_title,
    locale,
    disable_animations,
    border_radius,
    number_format,
    border_color,
    rank_icon,
    show,
  } = req.query;
  // Alteração do Content-Type para text/html
  res.setHeader("Content-Type", "text/html");

  if (blacklist.includes(username)) {
    return res.send(
      renderError("Something went wrong", "This username is blacklisted", {
        title_color,
        text_color,
        bg_color,
        border_color,
        theme,
      }),
    );
  }

  if (locale && !isLocaleAvailable(locale)) {
    return res.send(
      renderError("Something went wrong", "Language not found", {
        title_color,
        text_color,
        bg_color,
        border_color,
        theme,
      }),
    );
  }

  try {
    const showStats = parseArray(show);
    const stats = await fetchStats(
      username,
      parseBoolean(include_all_commits),
      parseArray(exclude_repo),
      showStats.includes("prs_merged") ||
        showStats.includes("prs_merged_percentage"),
      showStats.includes("discussions_started"),
      showStats.includes("discussions_answered"),
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

    return res.send(`
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Stats Card</title>
        </head>
        <body>
          <div>
            ${renderStatsCard(stats, {
              hide: parseArray(hide),
              show_icons: parseBoolean(show_icons),
              hide_title: parseBoolean(hide_title),
              hide_border: parseBoolean(hide_border),
              card_width: parseInt(card_width, 10),
              hide_rank: parseBoolean(hide_rank),
              include_all_commits: parseBoolean(include_all_commits),
              line_height,
              title_color,
              ring_color,
              icon_color,
              text_color,
              text_bold: parseBoolean(text_bold),
              bg_color,
              theme,
              custom_title,
              border_radius,
              border_color,
              number_format,
              locale: locale ? locale.toLowerCase() : null,
              disable_animations: parseBoolean(disable_animations),
              rank_icon,
              show: showStats,
            })}

            <!-- Adiciona o drop-down para selecionar o idioma -->
            <label for="languageSelector">Escolha o idioma:</label>
            <select id="languageSelector">
              <option value="en">Inglês</option> <!-- Inglês -->
              <option value="pt">Português</option> <!-- Português -->
              <option value="fr">Francês</option> <!-- Francês -->
              <option value="es">Espanhol</option> <!-- Espanhol -->
              <option value="de">Alemão</option> <!-- Alemão -->
              <option value="pl">Polonês</option> <!-- Polonês -->
              <option value="ru">Russo</option> <!-- Russo -->
              <option value="ar">Árabe</option> <!-- Árabe -->
              <option value="ja">Japonês</option> <!-- Japonês -->
              <option value="cn">Chinês</option> <!-- Chinês -->
              <option value="np">Nepalês</option> <!-- Nepalês -->
            </select>
          </div>

          <!-- Script para manipular o SVG -->
          <script>
            // Função para atualizar o conteúdo de vários elementos SVG com base na seleção de idioma
            function atualizarIdioma() {
              const svg = document.querySelector('svg');
              
              // Mapeia os rótulos correspondentes a cada idioma
              const translations = {
                en: {
                  title: "Most Used Languages",
                  stars: "Stars",
                  forks: "Forks",
                  commits: "Commits",
                  issues: "Issues",
                  prs: "Pull Requests"
                },
                pt: {
                  title: "Linguagens Mais Usadas",
                  stars: "Estrelas",
                  forks: "Bifurcações",
                  commits: "Commits",
                  issues: "Problemas",
                  prs: "Pull Requests"
                },
                fr: {
                  title: "Langages les plus utilisés",
                  stars: "Étoiles",
                  forks: "Fourchettes",
                  commits: "Commits",
                  issues: "Problèmes",
                  prs: "Pull Requests"
                },
                es: {
                  title: "Lenguajes más usados",
                  stars: "Estrellas",
                  forks: "Bifurcaciones",
                  commits: "Commits",
                  issues: "Problemas",
                  prs: "Pull Requests"
                },
                de: {
                  title: "Meist verwendete Sprache",
                  stars: "Sterne",
                  forks: "Gabelungen",
                  commits: "Commits",
                  issues: "Probleme",
                  prs: "Pull Requests"
                },
                pl: {
                  title: "Najczęściej używane języki",
                  stars: "Gwiazdy",
                  forks: "Forki",
                  commits: "Commity",
                  issues: "Problemy",
                  prs: "Pull Requests"
                },
                ru: {
                  title: "Наиболее используемые языки",
                  stars: "Звезды",
                  forks: "Форки",
                  commits: "Коммиты",
                  issues: "Проблемы",
                  prs: "Pull Requests"
                },
                ar: {
                  title: "أكثر اللغات استخداماً",
                  stars: "النجوم",
                  forks: "الفوركات",
                  commits: "الكوميتات",
                  issues: "المشكلات",
                  prs: "طلبات السحب"
                },
                ja: {
                  title: "最も使用されている言語",
                  stars: "スター",
                  forks: "フォーク",
                  commits: "コミット",
                  issues: "問題",
                  prs: "プルリクエスト"
                },
                cn: {
                  title: "最常用的语言",
                  stars: "星星",
                  forks: "分叉",
                  commits: "提交",
                  issues: "问题",
                  prs: "拉取请求"
                },
                np: {
                  title: "अधिक प्रयोग गरिएको भाषाहरू",
                  stars: "ताराहरू",
                  forks: "फोर्कहरू",
                  commits: "कमिटहरू",
                  issues: "समस्याहरू",
                  prs: "पुल अनुरोधहरू"
                }
              };

              // Obtém a opção de idioma selecionada
              const selectedLang = document.getElementById('languageSelector').value;
              const translation = translations[selectedLang];

              if (!translation) return; // Caso a tradução não exista

              // Atualiza o título e os campos com base na tradução
              const textElements = svg.querySelectorAll('text');
              textElements.forEach((textElement, index) => {
                switch(index) {
                  case 0:
                    textElement.textContent = translation.title;
                    break;
                  case 1:
                    textElement.textContent = translation.stars;
                    break;
                  case 2:
                    textElement.textContent = translation.forks;
                    break;
                  case 3:
                    textElement.textContent = translation.commits;
                    break;
                  case 4:
                    textElement.textContent = translation.issues;
                    break;
                  case 5:
                    textElement.textContent = translation.prs;
                    break;
                  // Adicione mais casos se houver mais campos
                }
              });
            }

            // Adiciona o evento de mudança ao drop-down
            document.getElementById('languageSelector').addEventListener('change', atualizarIdioma);
            
            // Chama a função para atualizar os campos ao carregar a página
            window.onload = atualizarIdioma;
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
    ); // Use lower cache period for errors.
    return res.send(
      renderError(err.message, err.secondaryMessage, {
        title_color,
        text_color,
        bg_color,
        border_color,
        theme,
      }),
    );
  }
};
