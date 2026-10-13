import { Link } from 'react-router-dom'

/**
 * 椤佃剼缁勪欢
 * - 鐗堟潈淇℃伅
 * - 蹇嵎閾炬帴
 */
export default function Footer() {
  return (
    <footer className="bg-[#fbf6e8] border-t border-[#b8a57f] mt-auto">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* 鍝佺墝淇℃伅 */}
          <div>
            <h3
              className="text-lg font-bold text-[#6b241f] mb-3 tracking-wider"
              style={{ fontFamily: "'SimSun', 'STSong', serif" }}
            >
              濂囬棬閬佺敳
            </h3>
            <p className="text-[#7f725f] text-sm leading-relaxed">
              浼犳壙涓崕浼犵粺鏂囧寲锛屾帰绱㈠彜鑰佹湳鏁版櫤鎱с€傛湰绔欐彁渚涘湪绾挎帓鐩樸€佺煡璇嗗涔犵瓑鏈嶅姟銆?            </p>
          </div>

          {/* 蹇嵎閾炬帴 */}
          <div>
            <h4 className="text-sm font-bold text-[#3e3429] mb-3">蹇嵎瀵艰埅</h4>
            <div className="flex flex-col space-y-2">
              <Link to="/" className="text-sm text-[#7f725f] hover:text-[#6b241f] transition-colors">
                棣栭〉
              </Link>
              <Link to="/divination" className="text-sm text-[#7f725f] hover:text-[#6b241f] transition-colors">
                鍦ㄧ嚎鎺掔洏
              </Link>
              <Link to="/knowledge" className="text-sm text-[#7f725f] hover:text-[#6b241f] transition-colors">
                鐭ヨ瘑搴?              </Link>
              <Link to="/cases" className="text-sm text-[#7f725f] hover:text-[#6b241f] transition-colors">
                妗堜緥搴?              </Link>
              <Link to="/about" className="text-sm text-[#7f725f] hover:text-[#6b241f] transition-colors">
                鍏充簬
              </Link>
            </div>
          </div>

          {/* 鍏嶈矗澹版槑 */}
          <div>
            <h4 className="text-sm font-bold text-[#3e3429] mb-3">鍏嶈矗澹版槑</h4>
            <p className="text-[#7f725f] text-sm leading-relaxed">
              鏈珯鍐呭浠呬緵鍙傝€冨拰瀛︿範涔嬬敤锛屼笉鏋勬垚浠讳綍鍐崇瓥寤鸿銆傚闂ㄩ亖鐢蹭负浼犵粺鏂囧寲鐟板疂锛岃鐞嗘€у寰呫€?            </p>
          </div>
        </div>

        {/* 搴曢儴鐗堟潈 */}
        <div className="mt-8 pt-6 border-t border-[#b8a57f] text-center">
          <p className="text-[#988a74] text-xs">
            &copy; {new Date().getFullYear()} 濂囬棬閬佺敳 - 鍦ㄧ嚎鎺掔洏绯荤粺 | 浼犳壙涓崕浼犵粺鏂囧寲
          </p>
        </div>
      </div>
    </footer>
  )
}



