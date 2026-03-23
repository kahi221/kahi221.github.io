// ガチャ石交換レート
const STONE_PER_PULL = 160;

// CSVテキストをパース（解析）して、日付と総回転数の配列にする関数
function parseCSV(csvText) {
  const lines = csvText.trim().split('\n');
  const data = {};
  
  for (let i = 1; i < lines.length; i++) {
    const row = lines[i].split(',');
    if (row.length < 3) continue;

    const date = row[0].trim();
    const tickets = parseFloat(row[1]) || 0;
    const stones = parseFloat(row[2]) || 0;
    const totalPulls = tickets + Math.floor(stones / STONE_PER_PULL);
    
    // 内訳を保存
    data[date] = { totalPulls: totalPulls, tickets: tickets, stones: stones };
  }
  return data;
}

// ★追加：円グラフを描画する関数
let myPieChartInstance = null; // 円グラフの本体を保存する変数

function drawPieChart(gsnStats, hsrStats, zzzStats) {
  const ctxPie = document.getElementById('myPieChart').getContext('2d');
  
  // 以前のグラフがあれば破棄する（再描画時のエラー防止）
  if (myPieChartInstance) {
    myPieChartInstance.destroy();
  }

  // 割合のパーセンテージを計算（工学的精度：小数第1位まで）
  const totalAll = parseFloat(gsnStats.all) + parseFloat(hsrStats.all) + parseFloat(zzzStats.all);
  const dataPercentages = [
    ((parseFloat(gsnStats.all) / totalAll) * 100).toFixed(1),
    ((parseFloat(hsrStats.all) / totalAll) * 100).toFixed(1),
    ((parseFloat(zzzStats.all) / totalAll) * 100).toFixed(1)
  ];

  myPieChartInstance = new Chart(ctxPie, {
    type: 'doughnut', // ドーナツ型円グラフ（中心にタイトルを入れるため）
    data: {
      labels: ['原神', 'HSR', 'ZZZ'],
      datasets: [{
        // Y軸の折れ線グラフと同じ色（borderColor）を適用
        backgroundColor: ['#55a3fb', '#f45b8e', '#01b94d'], 
        // 枠線の色（背景色と合わせる）
        borderColor: '#111111', 
        borderWidth: 2,
        data: [gsnStats.all, hsrStats.all, zzzStats.all],
        // ホバー時のエフェクト
        hoverOffset: 15,
        hoverBackgroundColor: ['#7bc0ff', '#ff84b0', '#34d173']
      }]
    },
    options: {
      maintainAspectRatio: false, // 高さを固定する
      cutout: '70%', // ドーナツの真ん中の穴の大きさ（大きくしてスッキリさせる）
      plugins: {
        legend: {
          display: false,
        //   position: 'right', // 凡例を右側に縦に並べる
        //   align: 'center',
        //   labels: {
        //     boxWidth: 15,
        //     boxHeight: 8,
        //     font: {
        //       size: 14 // 少し大きめに
        //     }
        //   }
        },
        // ツールチップ（マウスを乗せたときのポップアップ）のカスタマイズ
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)', // 真っ黒で引き締める
          titleFont: { family: "'DotGothic16', sans-serif", size: 16 },
          bodyFont: { family: "'DotGothic16', sans-serif", size: 14 },
          cornerRadius: 4,
          callbacks: {
            // ツールチップに「回数」と「割合」の両方を表示する工学的設定
            label: function(context) {
              const label = context.label || '';
              const value = context.parsed || 0;
              const percentage = dataPercentages[context.dataIndex];
              return `${label}: ${value.toFixed(1)} 回 (${percentage}%)`;
            }
          }
        }
      }
    }
  });
}

// 分析データを計算してHTMLに表示する関数
function displayAnalysis(gsn, hsr, zzz) {
  function calcStats(dataObj) {
    const dates = Object.keys(dataObj).sort((a, b) => new Date(a.replace(/-/g, '/')) - new Date(b.replace(/-/g, '/')));
    if (dates.length === 0) return { tickets: 0, stones: 0, avg: "0.00" };

    const latestDate = dates[dates.length - 1];
    const latestData = dataObj[latestDate];

    // 平均増加量の計算
    let totalIncrease = 0;
    let totalDays = 0;

    for (let i = 1; i < dates.length; i++) {
      const prev = dataObj[dates[i - 1]].totalPulls;
      const curr = dataObj[dates[i]].totalPulls;
      const diff = curr - prev;

      if (diff > 0) {
        const d1 = new Date(dates[i - 1].replace(/-/g, '/'));
        const d2 = new Date(dates[i].replace(/-/g, '/'));
        const days = (d2 - d1) / (1000 * 60 * 60 * 24);
        
        totalIncrease += diff;
        totalDays += days;
      }
    }

    const avg = totalDays > 0 ? (totalIncrease / totalDays).toFixed(2) : "0.00";

    return {
        all: ((latestData.stones / 160) + latestData.tickets).toFixed(1), // 小数第1位まで
        tickets: latestData.tickets,
        stones: latestData.stones,
        avg: avg
    };
  }

  // 計算実行
  const gsnStats = calcStats(gsn);
  const hsrStats = calcStats(hsr);
  const zzzStats = calcStats(zzz);

  // ★ここを追加：分析データが確定した瞬間に、円グラフも描画する！
  drawPieChart(gsnStats, hsrStats, zzzStats);

  // HTMLへの書き込み
  document.getElementById('gsn-all').innerText = gsnStats.all;
  document.getElementById('gsn-tick').innerText = gsnStats.tickets;
  document.getElementById('gsn-stone').innerText = gsnStats.stones;
  document.getElementById('gsn-avg').innerText = gsnStats.avg;

  document.getElementById('hsr-all').innerText = hsrStats.all;
  document.getElementById('hsr-tick').innerText = hsrStats.tickets;
  document.getElementById('hsr-stone').innerText = hsrStats.stones;
  document.getElementById('hsr-avg').innerText = hsrStats.avg;

  document.getElementById('zzz-all').innerText = zzzStats.all;
  document.getElementById('zzz-tick').innerText = zzzStats.tickets;
  document.getElementById('zzz-stone').innerText = zzzStats.stones;
  document.getElementById('zzz-avg').innerText = zzzStats.avg;
}

// 3つのCSVを読み込んでデータを作るメイン関数
async function loadChartData() {
  try {
    const [resGenshin, resStarRail, resZzz] = await Promise.all([
      fetch('../datas/gsn.csv'),
      fetch('../datas/hsr.csv'),
      fetch('../datas/zzz.csv')
    ]);

    const [textGenshin, textStarRail, textZzz] = await Promise.all([
      resGenshin.text(),
      resStarRail.text(),
      resZzz.text()
    ]);

    const genshinData = parseCSV(textGenshin);
    const starRailData = parseCSV(textStarRail);
    const zzzData = parseCSV(textZzz);

    // 更新日の表示
    const gsnDates = Object.keys(genshinData).sort((a, b) => new Date(a.replace(/-/g, '/')) - new Date(b.replace(/-/g, '/')));
    if (gsnDates.length > 0) {
        const lastDate = gsnDates[gsnDates.length - 1];
        document.getElementById('last-update-date').innerText = lastDate;
    }

    // 分析関数を呼び出して表示を更新
    displayAnalysis(genshinData, starRailData, zzzData);

    // 折れ線グラフ用のX軸（日付）作成
    const allDates = new Set([...Object.keys(genshinData), ...Object.keys(starRailData), ...Object.keys(zzzData)]);
    const labels = Array.from(allDates).sort((a, b) => new Date(a.replace(/-/g, '/')) - new Date(b.replace(/-/g, '/')));

    // 折れ線グラフ用のY軸データ（.totalPullsを取り出す）
    const genshinPulls = labels.map(date => genshinData[date] !== undefined ? genshinData[date].totalPulls : null);
    const starRailPulls = labels.map(date => starRailData[date] !== undefined ? starRailData[date].totalPulls : null);
    const zzzPulls = labels.map(date => zzzData[date] !== undefined ? zzzData[date].totalPulls : null);

    return {
      labels: labels,
      datasets: [
        { label: '原神', data: genshinPulls, borderColor: '#55a3fb', backgroundColor: '#000000', spanGaps: true },
        { label: 'HSR', data: starRailPulls, borderColor: '#f45b8e', backgroundColor: '#000000', spanGaps: true },
        { label: 'ZZZ', data: zzzPulls, borderColor: '#01b94d', backgroundColor: '#000000', spanGaps: true }
      ]
    };

  } catch (error) {
    console.error('CSVの読み込みに失敗しました:', error);
  }
}

// --- 以下の期間絞り込みやグラフ描画のロジックは前回から一切変更なし ---
let myChartInstance = null;
let globalFullData = null;

function filterDataByRange(fullData, range) {
  if (range === 'all') return fullData;

  const labels = fullData.labels;
  if (labels.length === 0) return fullData;

  const latestDateStr = labels[labels.length - 1];
  const latestDate = new Date(latestDateStr.replace(/-/g, '/'));
  const cutoffDate = new Date(latestDate);

  if (range === '1w') {
    cutoffDate.setDate(cutoffDate.getDate() - 7);
  } else if (range === '1m') {
    cutoffDate.setMonth(cutoffDate.getMonth() - 1);
  } else if (range === '3m') {
    cutoffDate.setMonth(cutoffDate.getMonth() - 3);
  } else if (range === '6m') {
    cutoffDate.setMonth(cutoffDate.getMonth() - 6);
  }

  const filteredLabels = [];
  const filteredDatasets = fullData.datasets.map(ds => ({ ...ds, data: [] }));

  labels.forEach((label, index) => {
    const currentDate = new Date(label.replace(/-/g, '/'));
    if (currentDate >= cutoffDate) {
      filteredLabels.push(label);
      fullData.datasets.forEach((ds, dsIndex) => {
        filteredDatasets[dsIndex].data.push(ds.data[index]);
      });
    }
  });

  return { labels: filteredLabels, datasets: filteredDatasets };
}

function changeChartRange(range, btnElement) {
  if (!globalFullData || !myChartInstance) return;

  if (btnElement) {
    const allBtns = document.querySelectorAll('.range-btn');
    allBtns.forEach(btn => btn.classList.remove('active'));
    btnElement.classList.add('active');
  }

  const newData = filterDataByRange(globalFullData, range);
  myChartInstance.data = newData;
  myChartInstance.update();
}

loadChartData().then(chartData => {
  if (chartData) {
    globalFullData = chartData;
    const initialData = filterDataByRange(globalFullData, 'all');

    Chart.defaults.font.family = "'DotGothic16', sans-serif";
    Chart.defaults.color = '#bbbbbb';

    const ctx = document.getElementById('myChart').getContext('2d');

    myChartInstance = new Chart(ctx, {
      type: 'line',
      data: initialData,
      options: {
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
                align: 'end',
                labels: {
                    usePointStyle: false,
                    boxWidth: 22,
                    boxHeight: 0,
                }
            }
        },
        scales: {
            x: {
                grid: { display: true, color: '#333333' },
                ticks: { display: true, maxRotation: 45, minRotation: 45 }
            },
            y: {
                // title: { display: true, text: '総回転数 [回]', font: { size: 14 } },
                grid: { display: true, color: '#333333' },
                ticks: { display: true }
            }
        }
      }
    });
  }
});