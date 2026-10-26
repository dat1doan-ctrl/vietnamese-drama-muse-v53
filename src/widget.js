import { App } from '@modelcontextprotocol/ext-apps';

(async () => {
  const app = new App(
    { name: 'Vietnamese Drama Muse V5.3', version: '5.3.0' },
    {},
    { autoResize: true }
  );

  await app.connect();

  const q = (n) => document.querySelector(`input[name="${n}"]:checked`);

  function getSelection() {
    const minutes = Number(q('minutes').value);
    const seconds = Number(q('seconds').value);
    const clips = Math.ceil((minutes * 60) / seconds);
    return {
      source: q('source').value,
      genre: q('genre').value,
      minutes,
      seconds,
      voice: q('voice').value,
      ratio: q('ratio').value,
      audio: q('audio').value,
      ending: q('ending').value,
      style: q('style').value,
      clips,
    };
  }

  function toConfigLine(s) {
    return [
      s.source,
      s.genre,
      `${s.minutes} phút`,
      `${s.seconds}s`,
      s.voice,
      s.ratio,
      s.audio.startsWith('A') ? 'A' : 'B',
      s.ending,
      s.style,
    ].join(', ');
  }

  function refresh() {
    const s = getSelection();
    document.getElementById('m').textContent = s.minutes;
    document.getElementById('clips').textContent = s.clips;
    document.getElementById('am').textContent = s.audio.startsWith('A') ? 'A' : 'B';
    document.getElementById('go').textContent = `🎬 Tạo ${s.clips} prompt Drama`;
  }

  document.querySelectorAll('input').forEach((el) => el.addEventListener('change', refresh));

  document.getElementById('go').addEventListener('click', async () => {
    const s = getSelection();
    const config = toConfigLine(s);
    const result = document.getElementById('result');
    result.style.display = 'block';
    result.innerHTML = `<b>Đã gửi cấu hình vào ChatGPT</b><br><br>${config}<br><br><b>${s.clips} prompt Drama</b>`;

    await app.updateModelContext({
      structuredContent: s,
      content: [{
        type: 'text',
        text: `Vietnamese Drama Muse selection: ${config}. Computed clip count: ${s.clips}.`,
      }],
    });

    await app.sendMessage({
      role: 'user',
      content: [{
        type: 'text',
        text: `Vietnamese Drama Muse — tiếp tục sản xuất theo cấu hình: ${config}. Nếu nguồn truyện là B, hãy gợi ý 5 ý tưởng gốc để tôi chọn; nếu đã có ý tưởng được chọn trong cuộc trò chuyện thì sản xuất đầy đủ ${s.clips} prompt Muse AI theo cấu hình này.`,
      }],
    });
  });

  refresh();
})().catch((error) => {
  console.error('Vietnamese Drama Muse widget failed to initialize', error);
});
