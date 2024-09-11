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
            // Função para atualizar o conteúdo do SVG com base na seleção de idioma
            function atualizarIdioma() {
              const svg = document.querySelector('svg');
              
              // Mapeia os rótulos correspondentes a cada idioma
              const translations = {
                en: {
                  title: "GitHub Statistics for PedroViniciusVicente, Rank: C",
                  desc: "Total Stars: 0, Total Commits in 2024: 61, Total PRs: 9, Total Issues: 3, Contributed to (last year): 7",
                },
                pt: {
                  title: "Estatísticas do GitHub de PedroViniciusVicente, Rank: C",
                  desc: "Total de Estrelas: 0, Total de Commits em 2024: 61, Total de PRs: 9, Total de Issues: 3, Contribuiu para (ano passado): 7",
                },
                fr: {
                  title: "Statistiques GitHub de PedroViniciusVicente, Rang: C",
                  desc: "Étoiles Totales: 0, Commits en 2024: 61, PRs Totales: 9, Issues Totales: 3, A Contribué à (l'année dernière): 7",
                },
                es: {
                  title: "Estadísticas de GitHub de PedroViniciusVicente, Rango: C",
                  desc: "Total de Estrellas: 0, Commits Totales en 2024: 61, Total de PRs: 9, Total de Issues: 3, Contribuyó a (el año pasado): 7",
                },
                // Outras traduções...
              };

              // Obtém a opção de idioma selecionada
              const selectedLang = document.getElementById('languageSelector').value;
              const translation = translations[selectedLang];

              if (!translation) return; // Caso a tradução não exista

              // Atualiza o <title> e o <desc> do SVG
              const titleElement = svg.querySelector('title');
              const descElement = svg.querySelector('desc');

              if (titleElement) titleElement.textContent = translation.title;
              if (descElement) descElement.textContent = translation.desc;
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
