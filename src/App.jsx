import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
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
      // 生成隨機 Pokemon ID (1-151 是第一代寶可夢)
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
          
          // 獲取隨機頭像
          fetchRandomAvatar();
          
          // 模擬從後端獲取餘額
          setBalance(Math.floor(Math.random() * 90000) + 10000);
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
        
        // 模擬從後端獲取餘額
        const initialBalance = Math.floor(Math.random() * 90000) + 10000;
        setBalance(initialBalance);
        
        // 模擬檢查是否為首次登入
        const simulateFirstLogin = Math.random() > 0.5;
        if (simulateFirstLogin) {
          setIsFirstLogin(true);
          setSuccessMessage(`首次登入成功！已為您初始化餘額: ${initialBalance}`);
        } else {
          setSuccessMessage(data.message || '登入成功！');
        }
        
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
      // 調用 API 更新餘額
      const response = await fetch('http://localhost:8585/wallet/updateTransferMoney', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          account: username,
          transfer: Number(depositAmount) // 存款為正數，增加餘額
        }),
        credentials: 'include' // 包含 cookies 以維持 session
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        // 存款成功，更新本地餘額
        setBalance(prevBalance => prevBalance + Number(depositAmount));
        setSuccessMessage(`存款成功！金額: ${depositAmount}`);
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
      // 調用 API 更新餘額
      const response = await fetch('http://localhost:8585/wallet/updateTransferMoney', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          account: username,
          transfer: -Number(withdrawAmount) // 提款為負數，減少餘額
        }),
        credentials: 'include' // 包含 cookies 以維持 session
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        // 提款成功，更新本地餘額
        setBalance(prevBalance => prevBalance - Number(withdrawAmount));
        setSuccessMessage(`提款成功！金額: ${withdrawAmount}`);
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

      // 調用 API 更新餘額
      const response = await fetch('http://localhost:8585/wallet/updateTransferMoney', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          account: username,
          transfer: -Number(transferAmount), // 轉帳為負數，減少餘額
          targetAccount: transferAccount,
          note: combinedNote
        }),
        credentials: 'include' // 包含 cookies 以維持 session
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        // 轉帳成功，更新本地餘額
        setBalance(prevBalance => prevBalance - Number(transferAmount));
        
        // 顯示備註信息
        const displayNote = doorNumber ? 
          `（門牌：${doorNumber}${transferNote ? `，備註：${transferNote}` : ''}）` : 
          (transferNote ? `（備註：${transferNote}）` : '');
        
        setSuccessMessage(`成功轉帳 ${transferAmount} 給帳號 ${transferAccount} ${displayNote}`);
        console.log(`送出的完整資訊: ${combinedNote}`);

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

        {!isLoggedIn ? (
          // 登入頁面
          <div className="login-container">
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
          <div className="wallet-container">
            <div className="user-info">
              <div className="avatar-container">
                {avatar && <img src={avatar} alt="User Avatar" className="user-avatar" />}
              </div>
              <h2>hello {username}，歡迎登入!</h2>
            </div>

            {errorMessage && <p className="error-message">{errorMessage}</p>}
            {successMessage && <p className="success-message">{successMessage}</p>}

            <div className="balance-container">
              <h3>當前餘額: {balance}</h3>
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