import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState(''); // 新增顯示名稱狀態
  const [password, setPassword] = useState('');
  const [captcha, setCaptcha] = useState('');
  const [userCaptcha, setUserCaptcha] = useState('');
  const [balance, setBalance] = useState(0);
  const [depositAmount, setDepositAmount] = useState(0);
  const [withdrawAmount, setWithdrawAmount] = useState(0);
  const [transferAmount, setTransferAmount] = useState(0);
  const [transferAccount, setTransferAccount] = useState('');
  const [transferNote, setTransferNote] = useState('');
  const [doorNumber, setDoorNumber] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isFirstLogin, setIsFirstLogin] = useState(false);
  const [avatar, setAvatar] = useState(null);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [showAnimation, setShowAnimation] = useState(false); // 新增動畫狀態
  const [animationType, setAnimationType] = useState(''); // 新增動畫類型

  // 生成驗證碼
  const generateCaptcha = () => {
    let newCaptcha = '';
    for (let i = 0; i < 4; i++) {
      newCaptcha += Math.floor(Math.random() * 10);
    }
    setCaptcha(newCaptcha);
  };

  // 從 PokeAPI 獲取隨機頭像
  const fetchRandomAvatar = async () => {
    try {
      // 生成隨機 Pokemon ID (1-1025)
      const randomId = Math.floor(Math.random() * 1025) + 1;
      const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${randomId}`);
      const data = await response.json();
      // 使用官方正面圖片
      setAvatar(data.sprites.front_default);
    } catch (error) {
      console.error("無法獲取寶可夢頭像:", error);
      // 如果 API 請求失敗，使用預設頭像
      setAvatar("https://via.placeholder.com/96");
    }
  };

  // 顯示提示訊息
  const showAlertMessage = (message) => {
    setAlertMessage(message);
    setShowAlert(true);
    setTimeout(() => {
      setShowAlert(false);
    }, 3000);
  };

  // 顯示動畫效果
  const showAnimationEffect = (type) => {
    setAnimationType(type);
    setShowAnimation(true);
    setTimeout(() => {
      setShowAnimation(false);
    }, 2000);
  };

  // 獲取用戶餘額 - 修正後的函數
  const fetchBalance = async (account) => {
    try {
      console.log("正在獲取餘額，帳號:", account);
      const response = await fetch(`http://localhost:8585/wallet/balance?account=${account}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log("獲取餘額回應:", data);

        if (data.success) {
          console.log("設置餘額為:", data.balance);
          setBalance(Number(data.balance));
        } else {
          console.error("獲取餘額失敗:", data.message);
        }
      } else {
        console.error("獲取餘額請求失敗:", response.status);
      }
    } catch (error) {
      console.error("獲取餘額時發生錯誤:", error);
    }
  };

  // 獲取用戶資料
  const fetchUserInfo = async (identityNumber) => {
    try {
      const response = await fetch(`http://localhost:8585/wallet/user-info?identityNumber=${identityNumber}`, {
        method: 'GET',
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.name) {
          setDisplayName(data.name);
        } else {
          // 如果無法獲取名稱，使用身分證號作為備用
          setDisplayName(identityNumber);
        }
      } else {
        // 無法獲取資料時使用身分證號
        setDisplayName(identityNumber);
      }
    } catch (error) {
      console.error("獲取用戶資料時發生錯誤:", error);
      setDisplayName(identityNumber);
    }
  };

  // 檢查用戶登入狀態
  const checkSession = async () => {
    try {
      const response = await fetch('http://localhost:8585/wallet/check-session', {
        method: 'GET',
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();

        if (data.isLoggedIn) {
          // 用戶已登入，設置相關狀態
          setIsLoggedIn(true);
          setUsername(data.identityNumber || '');

          // 獲取用戶名稱
          if (data.identityNumber) {
            fetchUserInfo(data.identityNumber);
          }

          // 獲取隨機頭像
          fetchRandomAvatar();

          // 從後端獲取實際餘額
          if (data.identityNumber) {
            fetchBalance(data.identityNumber);
          }
        }
      }
    } catch (error) {
      console.error("檢查登入狀態時發生錯誤:", error);
    }
  };

  // 初始化頁面時生成驗證碼並檢查登入狀態
  useEffect(() => {
    generateCaptcha();
    checkSession();
  }, []);

  // 處理登入
  const handleLogin = async () => {
    // 清除訊息
    setErrorMessage('');
    setSuccessMessage('');

    // 先檢查驗證碼
    if (userCaptcha !== captcha) {
      setErrorMessage('驗證碼錯誤，請重新輸入');
      generateCaptcha();
      return;
    }

    try {
      const response = await fetch('http://localhost:8585/wallet/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          identityNumber: username,
          password: password
        }),
        credentials: 'include' // 重要：包含cookies以維持session
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // 登入成功
        fetchRandomAvatar();

        // 獲取用戶名稱
        fetchUserInfo(username);

        // 獲取實際餘額
        fetchBalance(username);

        setSuccessMessage(data.message || '登入成功！');
        showAlertMessage('登入成功！');
        setIsLoggedIn(true);
      } else {
        // 登入失敗
        setErrorMessage(data.message || '帳號或密碼錯誤');
        generateCaptcha();
      }
    } catch (error) {
      console.error("登入時發生錯誤:", error);
      setErrorMessage('連接伺服器時發生錯誤，請稍後再試');
      generateCaptcha();
    }
  };

  // 處理存款
  const handleDeposit = async () => {
    if (depositAmount <= 0) {
      setErrorMessage('請輸入有效金額');
      return;
    }

    try {
      // 使用正確的存款 API
      const response = await fetch('http://localhost:8585/wallet/deposit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          account: username,
          transfer: Number(depositAmount) // 存款金額
        }),
        credentials: 'include' // 包含 cookies 以維持 session
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // 存款成功
        const successMsg = `存款成功！金額: ${depositAmount}`;
        setSuccessMessage(successMsg);
        showAlertMessage(successMsg);
        showAnimationEffect('deposit'); // 顯示存款動畫

        // 獲取更新後的餘額
        await fetchBalance(username);
        setDepositAmount(0);
      } else {
        // 存款失敗
        setErrorMessage(data.message || '存款失敗，請稍後再試');
      }
    } catch (error) {
      console.error("存款時發生錯誤:", error);
      setErrorMessage('連接伺服器時發生錯誤，請稍後再試');
    }
  };

  // 處理提款
  const handleWithdraw = async () => {
    if (withdrawAmount <= 0) {
      setErrorMessage('請輸入有效金額');
      return;
    }

    if (withdrawAmount > balance) {
      setErrorMessage('餘額不足');
      return;
    }

    try {
      // 使用正確的提款 API
      const response = await fetch('http://localhost:8585/wallet/withdraw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          account: username,
          transfer: Number(withdrawAmount) // 提款金額
        }),
        credentials: 'include' // 包含 cookies 以維持 session
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // 提款成功
        const successMsg = `提款成功！金額: ${withdrawAmount}`;
        setSuccessMessage(successMsg);
        showAlertMessage(successMsg);
        showAnimationEffect('withdraw'); // 顯示提款動畫

        // 獲取更新後的餘額
        await fetchBalance(username);
        setWithdrawAmount(0);
      } else {
        // 提款失敗
        setErrorMessage(data.message || '提款失敗，請稍後再試');
      }
    } catch (error) {
      console.error("提款時發生錯誤:", error);
      setErrorMessage('連接伺服器時發生錯誤，請稍後再試');
    }
  };

  // 處理轉帳
  const handleTransfer = async () => {
    if (transferAmount <= 0) {
      setErrorMessage('請輸入有效金額');
      return;
    }

    if (transferAmount > balance) {
      setErrorMessage('餘額不足');
      return;
    }

    if (!transferAccount) {
      setErrorMessage('請輸入轉帳帳號');
      return;
    }

    try {
      // 組合門牌和備註信息
      let combinedNote = "";
      if (doorNumber) {
        combinedNote = `${transferAccount}#${doorNumber}`;
        if (transferNote) {
          combinedNote += `#${transferNote}`;
        }
      } else if (transferNote) {
        combinedNote = transferNote;
      }

      // 使用正確的轉帳 API
      const response = await fetch('http://localhost:8585/wallet/transfer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          account: username,
          transfer: Number(transferAmount), // 轉帳金額
          targetAccount: transferAccount,
          note: combinedNote
        }),
        credentials: 'include' // 包含 cookies 以維持 session
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // 轉帳成功
        // 顯示備註信息
        const displayNote = doorNumber ?
          `（門牌：${doorNumber}${transferNote ? `，備註：${transferNote}` : ''}）` :
          (transferNote ? `（備註：${transferNote}）` : '');

        const successMsg = `成功轉帳 ${transferAmount} 給帳號 ${transferAccount} ${displayNote}`;
        setSuccessMessage(successMsg);
        showAlertMessage(successMsg);
        showAnimationEffect('transfer'); // 顯示轉帳動畫
        console.log(`送出的完整資訊: ${combinedNote}`);

        // 獲取更新後的餘額
        await fetchBalance(username);

        setTransferAmount(0);
        setTransferAccount('');
        setTransferNote('');
        setDoorNumber('');
      } else {
        // 轉帳失敗
        setErrorMessage(data.message || '轉帳失敗，請稍後再試');
      }
    } catch (error) {
      console.error("轉帳時發生錯誤:", error);
      setErrorMessage('連接伺服器時發生錯誤，請稍後再試');
    }
  };

  // 處理選擇預設備註
  const handleSelectNote = (note) => {
    setTransferNote(note);
  };

  // 登出
  const handleLogout = async () => {
    try {
      const response = await fetch('http://localhost:8585/wallet/logout', {
        method: 'GET',
        credentials: 'include' // 重要：包含cookies以維持session
      });

      // 無論伺服器回應如何，都清空本地狀態
      setIsLoggedIn(false);
      setUsername('');
      setDisplayName('');
      setPassword('');
      setUserCaptcha('');
      setBalance(0);
      setDepositAmount(0);
      setWithdrawAmount(0);
      setTransferAmount(0);
      setTransferAccount('');
      setTransferNote('');
      setDoorNumber('');
      setErrorMessage('');
      setSuccessMessage('');
      setAvatar(null);
      generateCaptcha();

      // 可選：顯示登出成功訊息
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          console.log("成功登出系統");
          showAlertMessage('已成功登出');
        }
      }
    } catch (error) {
      console.error("登出時發生錯誤:", error);
      // 即使API調用失敗，仍然執行本地登出
    }
  };

  // 清除訊息
  const clearMessages = () => {
    setErrorMessage('');
    setSuccessMessage('');
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>OO錢包 App</h1>

        {/* 操作成功提示彈窗 */}
        {showAlert && (
          <div className="alert-message">
            {alertMessage}
          </div>
        )}

        {/* 新增交易動畫效果 */}
        {showAnimation && (
          <div className={`transaction-animation ${animationType}`}>
            {animationType === 'deposit' && (
              <div className="money-animation money-in">
                <span className="money-icon">💰</span>
                <span className="money-icon">💵</span>
                <span className="money-icon">💸</span>
              </div>
            )}
            {animationType === 'withdraw' && (
              <div className="money-animation money-out">
                <span className="money-icon">💸</span>
                <span className="money-icon">💵</span>
                <span className="money-icon">💰</span>
              </div>
            )}
            {animationType === 'transfer' && (
              <div className="money-animation money-transfer">
                <span className="money-icon">📤</span>
                <span className="money-icon">💸</span>
                <span className="money-icon">📥</span>
              </div>
            )}
          </div>
        )}

        {!isLoggedIn ? (
          // 登入頁面
          <div className="login-container" style={{ animation: 'none' }}>
            <h2>請登入</h2>
            {errorMessage && <p className="error-message">{errorMessage}</p>}

            <div className="input-group">
              <label>帳號:</label>
              <input
                type="text"
                value={username}
                onChange={(e) => { setUsername(e.target.value); clearMessages(); }}
                placeholder="請輸入帳號"
              />
            </div>

            <div className="input-group">
              <label>密碼:</label>
              <input
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); clearMessages(); }}
                placeholder="請輸入密碼"
              />
            </div>

            <div className="input-group">
              <label>驗證碼: {captcha}</label>
              <input
                type="text"
                value={userCaptcha}
                onChange={(e) => { setUserCaptcha(e.target.value); clearMessages(); }}
                placeholder="請輸入驗證碼"
              />
              <button onClick={generateCaptcha} className="captcha-button">重新產生</button>
            </div>

            <button onClick={handleLogin} className="login-button">登入</button>

          </div>
        ) : (
          // 功能頁面
          <div className="wallet-container" style={{ animation: 'none' }}>
            <div className="user-info">
              <div className="avatar-container">
                {avatar && <img src={avatar} alt="User Avatar" className="user-avatar" />}
              </div>
              <h2>hello {displayName}，歡迎登入!</h2>
            </div>

            {errorMessage && <p className="error-message">{errorMessage}</p>}
            {successMessage && <p className="success-message">{successMessage}</p>}

            <div className="balance-container">
              <h3>當前餘額: {balance}</h3>
              <button onClick={() => fetchBalance(username)} className="refresh-button">重新整理餘額</button>
            </div>

            <div className="functions-container">
              {/* 存款區塊 */}
              <div className="function-block">
                <h3>存款</h3>
                <div className="input-group">
                  <label>金額:</label>
                  <input
                    type="number"
                    value={depositAmount}
                    onChange={(e) => { setDepositAmount(e.target.value); clearMessages(); }}
                    placeholder="請輸入金額"
                  />
                </div>
                <button onClick={handleDeposit} className="function-button">存款</button>
              </div>

              {/* 提款區塊 */}
              <div className="function-block">
                <h3>提款</h3>
                <div className="input-group">
                  <label>金額:</label>
                  <input
                    type="number"
                    value={withdrawAmount}
                    onChange={(e) => { setWithdrawAmount(e.target.value); clearMessages(); }}
                    placeholder="請輸入金額"
                  />
                </div>
                <button onClick={handleWithdraw} className="function-button">提款</button>
              </div>

              {/* 匯款區塊 */}
              <div className="function-block">
                <h3>匯款</h3>
                <div className="input-group">
                  <label>帳號:</label>
                  <input
                    type="text"
                    value={transferAccount}
                    onChange={(e) => { setTransferAccount(e.target.value); clearMessages(); }}
                    placeholder="請輸入匯款帳號"
                  />
                </div>
                <div className="input-group">
                  <label>金額:</label>
                  <input
                    type="number"
                    value={transferAmount}
                    onChange={(e) => { setTransferAmount(e.target.value); clearMessages(); }}
                    placeholder="請輸入金額"
                  />
                </div>
                <div className="input-group">
                  <label>門牌:</label>
                  <input
                    type="text"
                    value={doorNumber}
                    onChange={(e) => { setDoorNumber(e.target.value); clearMessages(); }}
                    placeholder="請輸入門牌(選填)"
                  />
                </div>
                <div className="input-group">
                  <label>備註:</label>
                  <input
                    type="text"
                    value={transferNote}
                    onChange={(e) => { setTransferNote(e.target.value); clearMessages(); }}
                    placeholder="請輸入備註(選填)"
                  />
                  <div className="note-buttons">
                    <button type="button" onClick={() => handleSelectNote('車位費')} className="note-button">車位費</button>
                    <button type="button" onClick={() => handleSelectNote('管理費')} className="note-button">管理費</button>
                  </div>
                </div>
                <button onClick={handleTransfer} className="function-button">匯款</button>
                <p className="hint">管理員帳號: 102420484096</p>
              </div>
            </div>

            <button onClick={handleLogout} className="logout-button">登出</button>
          </div>
        )}
      </header>
    </div>
  );
}

export default App;