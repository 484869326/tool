const short = document.querySelector("#short");
const long = document.querySelector("#long");
const reset = document.querySelector("#reset");
const exchange = document.querySelector("#exchange");
const goodid = document.querySelector("#goodid") || {};
const mask = document.querySelector(".mask");
const copy = document.querySelector("#copy");
//复制
try {
    copy.addEventListener('click', () => {
        navigator.clipboard.writeText(long.value);
    })
} catch (error) {

}
//重置
reset.addEventListener("click", () => {
    short.value = '';
    long.value = '';
    goodid.innerText = '';
})
// 转换
exchange.addEventListener("click", async (event) => {
    const isHost = Boolean(event.target.dataset.host);
    mask.style.display = 'block';
    long.value = '';
    goodid.innerText = '';
    const arr = short.value.split(/\s+/);
    if (arr.length > 15 && !isHost) {
        setTimeout(() => {
            alert("最多15条");
            mask.style.display = 'none';
        }, 1000)
        return;
    }
    try {
        const res = await concurRequest('https://www.bejson.com/Bejson/Api/ShortUrl/restoreShortUrl', arr, 20);
        long.value = res.join('\n');
        res.forEach((item) => {
            const content = new URL(item);
            const params = new URLSearchParams(content.search);
            const goodsId = params.get('goods_id');
            goodid.innerText += goodsId + ',';
        })
    } catch (error) {
        console.log(error);
    } finally {
        mask.style.display = 'none';
    }
})
//网络请求
function useFetch(url, formData) {
    return new Promise((resolve, reject) => {
        try {
            fetch(url, {
                method: 'post',
                body: formData
            }).then(response => response.json()).then(res => {
                if (res.code === 200) {
                    resolve(res.data.long_url)
                } else {
                    reject(res.msg)
                }
            }).catch(() => {
                reject('');
            });
        } catch {
            reject('');
        }
    })
}
//并发请求
function concurRequest(url, params, maxNum) {
    if (params.length === 0) return Promise.resolve([]);
    return new Promise((resolve) => {
        let index = 0;
        const result = [];
        let count = 0;
        async function _request() {
            const i = index;
            const param = params[index];
            index++;
            const formData = new FormData();
            formData.append('url', param);
            try {
                const res = await useFetch(url, formData);
                result[i] = res;
            } catch (error) {
                const str = error ? `，错误原因:${error}` : ''
                result[i] = `第${i + 1}条请求失败${str}`
            } finally {
                count++;
                if (count === params.length) {
                    resolve(result);
                }
                if (index < params.length) {
                    _request();
                }
            }
        }
        for (let i = 0; i < Math.min(maxNum, params.length); i++) {
            _request();
        }
    })
}