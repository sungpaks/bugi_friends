- [영문](#english)
- [국문](#korean)

# English

## 🛡️ Bugi and Friends Privacy Policy

This Privacy Policy governs the types of information, purposes, and methods of processing information collected from users by the Chrome extension **Bugi and Friends** ("this Extension").

### 1. Types and Purposes of Information Collected and Used

| Type of Information                   | Purpose of Collection                                                                                                 | Method of Collection                                                  | Storage and Retention                                                      |
| :------------------------------------ | :-------------------------------------------------------------------------------------------------------------------- | :-------------------------------------------------------------------- | :------------------------------------------------------------------------- |
| **Google AI Studio (Gemini) API Key** | To provide **Gemini API calling functionality** within this Extension and ensure smooth service delivery to the user. | **Direct input** by the user through the Extension's settings screen. | Refer to the **'Information Retention and Storage Choice'** section below. |
| **Remove.bg API Key**                 | To provide **background removal functionality** for generated sprite sheets within this Extension.                    | **Direct input** by the user through the Extension's settings screen. | Refer to the **'Information Retention and Storage Choice'** section below. |

### 2. Principle of Non-Collection and Non-Transmission of Personal Information

**This Extension does not transmit or store any user information, including the Gemini API Key and Remove.bg API Key, to the developer's server or any external system.** All information processing occurs **only within the user's browser.**

**Note:** When the user uses a special coupon code (e.g., "hamburger") instead of their own API Key, the request is routed through a proxy server for rate limiting purposes. However, **no personal information is stored or logged** during this process.

### 3. Information Retention and Storage Choice (Specific to API Keys)

The storage method for the Gemini API Key and Remove.bg API Key entered by the user is divided based on user choice as follows:

#### A. Non-Storage (Default)

- **Processing Method:** This is the default setting if the user **does not select** the "Store API Key (Local)" option.
- **Retention:** The entered API Keys are **used only temporarily** during API calls (Gemini or Remove.bg) and are **immediately destroyed from memory** once the call is complete or the browser is closed.
- **Safety:** This is the **most recommended method** for securely maintaining API Keys.

#### B. Local Storage (Optional)

- **Processing Method:** This only applies when the user **explicitly selects** the "Store API Key (Local)" option for service convenience.
- **Retention:** The entered API Keys are stored in the user's **web browser's internal storage, LocalStorage**. This is to prevent the user from having to re-enter the keys every time they open the Extension.
- **External Transmission:** The Keys stored in LocalStorage **are not transmitted externally.**

---

### 🚨 4. Notice of Risk When Storing in LocalStorage (Mandatory Reading)

**LocalStorage is not a mechanism designed to securely store sensitive information.** By choosing the LocalStorage option, the user acknowledges and agrees to the following potential security risks:

- **Plain Text Storage:** LocalStorage stores data in **unencrypted plain text**, which can be **easily accessed and viewed** by anyone through the browser's developer tools.
- **XSS (Cross-Site Scripting) Attack Risk:** If the user visits a website containing malicious scripts, there is a **risk that the script may access LocalStorage** and **steal** the stored API Keys.
- **Access by Malicious Extensions:** Other **malicious Chrome extensions** with specific permissions may potentially access data stored in LocalStorage.

> **The developer of this Extension assumes no responsibility for any leakage, misuse, or resulting damages of the API Keys that occur due to the selection of the LocalStorage option.** We strongly **recommend the method of entering the keys upon use, without storing them**, for secure key management.

---

### 5. User Rights and Management of Stored Information

- **Information Access and Deletion:** Users can **verify and delete** the API Keys stored in LocalStorage **at any time directly** through the Extension's settings page.
- **Withdrawal of Consent:** To withdraw consent for API Key storage, the user can uncheck the storage option and delete the stored keys on the settings page.

### 6. Contact Us

- Contact Information(E-mail): emforhs03150@gmail.com

---

# Korean

## 🛡️ Bugi and Friends 개인정보 처리방침 (한국어)

본 개인정보 처리방침은 크롬 확장 프로그램 **Bugi and Friends**("본 확장 프로그램")이 사용자로부터 수집하고 처리하는 정보의 종류, 목적 및 방법을 규정합니다.

### 1. 수집 및 이용하는 정보의 종류 및 목적

| 정보의 종류                          | 수집 목적                                                                                           | 수집 방법                                               | 저장 및 보관                                  |
| :----------------------------------- | :-------------------------------------------------------------------------------------------------- | :------------------------------------------------------ | :-------------------------------------------- |
| **Google AI Studio (Gemini) API 키** | 본 확장 프로그램 내 **Gemini API 호출** 기능을 제공하고 사용자에게 서비스를 원활하게 제공하기 위함. | 사용자가 확장 프로그램의 설정 화면을 통해 **직접 입력** | 아래 **'정보의 보관 및 저장 선택'** 항목 참조 |
| **Remove.bg API 키**                 | 본 확장 프로그램 내 **생성된 스프라이트 시트의 배경 제거** 기능을 제공하기 위함.                    | 사용자가 확장 프로그램의 설정 화면을 통해 **직접 입력** | 아래 **'정보의 보관 및 저장 선택'** 항목 참조 |

### 2. 개인정보의 비(非)수집 및 비(非)전송 원칙

본 확장 프로그램은 **Gemini API 키 및 Remove.bg API 키를 포함한 어떠한 사용자 정보도 개발자의 서버나 외부 시스템으로 전송하거나 저장하지 않습니다.** 모든 정보 처리는 **오직 사용자의 브라우저 내에서** 이루어집니다.

**참고:** 사용자가 본인의 API 키 대신 특별 쿠폰 코드(예: "hamburger")를 사용할 경우, 요청은 사용량 제한 관리를 위해 프록시 서버를 거치게 됩니다. 그러나 이 과정에서 **어떠한 개인정보도 저장되거나 기록되지 않습니다.**

### 3. 정보의 보관 및 저장 선택 (API 키에 특화)

사용자가 입력한 Gemini API 키 및 Remove.bg API 키의 저장 방식은 사용자 선택에 따라 다음과 같이 구분됩니다.

#### A. 비저장 (기본값)

- **처리 방식:** 사용자가 "API 키 저장(Local)" 옵션을 **선택하지 않은 경우**의 기본값입니다.
- **보관:** 입력된 API 키들은 API 호출 시(Gemini 또는 Remove.bg) **일시적으로만 사용**되며, 호출이 완료되거나 브라우저가 종료되면 **즉시 메모리에서 파기**됩니다.
- **안전성:** API 키를 안전하게 유지하는 **가장 권장되는 방식**입니다.

#### B. 로컬 저장 (선택 사항)

- **처리 방식:** 사용자가 서비스 이용 편의를 위해 **"API 키 저장(Local)" 옵션을 명시적으로 선택**한 경우에만 적용됩니다.
- **보관:** 입력된 API 키들은 사용자의 **웹 브라우저 내부 저장 공간인 LocalStorage**에 저장됩니다. 이는 사용자가 확장 프로그램을 다시 열 때마다 키를 재입력할 필요가 없도록 하기 위함입니다.
- **외부 전송:** LocalStorage에 저장된 키들은 **외부로 전송되지 않습니다.**

---

### 🚨 4. LocalStorage 저장 시의 위험 고지 (필독)

**LocalStorage는 민감한 정보를 안전하게 저장하도록 설계된 메커니즘이 아닙니다.** LocalStorage 저장 옵션을 선택할 경우, 사용자는 다음과 같은 잠재적인 보안 위험을 인지하고 이에 동의하는 것으로 간주합니다.

- **일반 텍스트 저장:** LocalStorage는 데이터를 **암호화하지 않은 일반 텍스트 형태**로 저장하며, 이는 브라우저의 개발자 도구를 통해 누구든지 **쉽게 접근하여 열람**할 수 있습니다.
- **XSS (Cross-Site Scripting) 공격 위험:** 사용자가 악성 스크립트가 포함된 웹사이트를 방문할 경우, 해당 스크립트가 LocalStorage에 접근하여 저장된 API 키들을 **탈취할 위험**이 있습니다.
- **악성 확장 프로그램 접근:** 특정 권한을 가진 **악의적인 다른 크롬 확장 프로그램**이 LocalStorage에 저장된 데이터에 접근할 가능성이 있습니다.

> **본 확장 프로그램 개발사는 LocalStorage 저장 옵션 선택으로 인해 발생하는 API 키들의 유출, 오용 및 그로 인한 손해에 대해 어떠한 책임도 지지 않습니다.** 안전한 키 관리를 위해 가급적 **키를 저장하지 않고 사용 시마다 입력하는 방식**을 권장합니다.

---

### 5. 사용자의 권리 및 저장 정보 관리

- **정보 열람 및 삭제:** 사용자는 확장 프로그램의 설정 페이지를 통해 LocalStorage에 저장된 API 키들을 **언제든지 직접 확인하고 삭제**할 수 있습니다.
- **동의 철회:** API 키 저장에 대한 동의를 철회하려면, 설정 페이지에서 해당 저장 옵션을 해제하고 저장된 키들을 삭제하면 됩니다.

### 6. 문의 사항

본 개인정보 처리방침과 관련하여 궁금한 사항이 있으시면 다음 연락처로 문의해 주시기 바랍니다.

- **개발자 연락처:** emforhs03150@gmail.com
