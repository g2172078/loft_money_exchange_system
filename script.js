// 定数定義
const TARGET_COINS = 50;
const TARGET_5000 = 20;
const TARGET_1000 = 40;
const MIN_COINS = 10;
const MIN_BILLS = 5;
const TARGET_422_TOTAL = 83250;
const TARGET_423_TOTAL = 33300;

// 422レジの紙幣最低保有枚数
const MIN_HOLD_5000 = 5;  // 5000円札の最低保有枚数
const MIN_HOLD_1000 = 10; // 1000円札の最低保有枚数

// 422レジの紙幣目標枚数（両替機利用の判断基準）
const TARGET_422_BILLS_5000 = 30;  // 5000円札の目標枚数
const TARGET_422_BILLS_1000 = 60;  // 1000円札の目標枚数

// 422レジの硬貨合計目標金額
const TARGET_422_COINS_TOTAL = 90000;

// 棒金の上限
const MAX_ROLLS_500 = 2;  // 500円/50円/5円の棒金上限
const MAX_ROLLS_100 = 5;  // 100円/10円/1円の棒金上限

// バラ硬貨の最低枚数（これ以下になると棒金を崩す必要がある）
const MIN_LOOSE_COINS = 20;

// 在高クラス
class CashInventory {
    constructor() {
        this.bills10000 = 0;
        this.bills5000 = 0;
        this.bills1000 = 0;
        this.coins500 = 0;
        this.coins100 = 0;
        this.coins50 = 0;
        this.coins10 = 0;
        this.coins5 = 0;
        this.coins1 = 0;
        this.rolls500 = 0;
        this.rolls100 = 0;
        this.rolls50 = 0;
        this.rolls10 = 0;
        this.rolls5 = 0;
        this.rolls1 = 0;
    }

    getTotalValue() {
        let total = 0;
        total += this.bills10000 * 10000;
        total += this.bills5000 * 5000;
        total += this.bills1000 * 1000;
        total += this.coins500 * 500;
        total += this.coins100 * 100;
        total += this.coins50 * 50;
        total += this.coins10 * 10;
        total += this.coins5 * 5;
        total += this.coins1 * 1;
        total += this.rolls500 * 500 * 50;
        total += this.rolls100 * 100 * 50;
        total += this.rolls50 * 50 * 50;
        total += this.rolls10 * 10 * 50;
        total += this.rolls5 * 5 * 50;
        total += this.rolls1 * 1 * 50;
        return total;
    }

    getCoinCount(denomination) {
        const mapping = {
            10000: this.bills10000,
            5000: this.bills5000,
            1000: this.bills1000,
            500: this.coins500,
            100: this.coins100,
            50: this.coins50,
            10: this.coins10,
            5: this.coins5,
            1: this.coins1
        };
        return mapping[denomination] || 0;
    }

    getRollCount(denomination) {
        const mapping = {
            500: this.rolls500,
            100: this.rolls100,
            50: this.rolls50,
            10: this.rolls10,
            5: this.rolls5,
            1: this.rolls1
        };
        return mapping[denomination] || 0;
    }

    setCoinCount(denomination, count) {
        if (denomination === 10000) this.bills10000 = count;
        else if (denomination === 5000) this.bills5000 = count;
        else if (denomination === 1000) this.bills1000 = count;
        else if (denomination === 500) this.coins500 = count;
        else if (denomination === 100) this.coins100 = count;
        else if (denomination === 50) this.coins50 = count;
        else if (denomination === 10) this.coins10 = count;
        else if (denomination === 5) this.coins5 = count;
        else if (denomination === 1) this.coins1 = count;
    }

    setRollCount(denomination, count) {
        if (denomination === 500) this.rolls500 = count;
        else if (denomination === 100) this.rolls100 = count;
        else if (denomination === 50) this.rolls50 = count;
        else if (denomination === 10) this.rolls10 = count;
        else if (denomination === 5) this.rolls5 = count;
        else if (denomination === 1) this.rolls1 = count;
    }

    clone() {
        const copy = new CashInventory();
        copy.bills10000 = this.bills10000;
        copy.bills5000 = this.bills5000;
        copy.bills1000 = this.bills1000;
        copy.coins500 = this.coins500;
        copy.coins100 = this.coins100;
        copy.coins50 = this.coins50;
        copy.coins10 = this.coins10;
        copy.coins5 = this.coins5;
        copy.coins1 = this.coins1;
        copy.rolls500 = this.rolls500;
        copy.rolls100 = this.rolls100;
        copy.rolls50 = this.rolls50;
        copy.rolls10 = this.rolls10;
        copy.rolls5 = this.rolls5;
        copy.rolls1 = this.rolls1;
        return copy;
    }
}

// 最適化エンジン
class CashExchangeOptimizer {
    constructor(reg422, reg423) {
        this.reg422 = reg422.clone();
        this.reg423 = reg423.clone();
        this.exchangeSteps = [];

        // 初期在高を保存
        this.initialReg422 = reg422.clone();
        this.initialReg423 = reg423.clone();

        // 出金・入金の追跡
        this.reg422Withdrawals = 0;  // 422レジからの出金総額
        this.reg422Deposits = 0;      // 422レジへの入金総額
        this.reg423Withdrawals = 0;  // 423レジからの出金総額
        this.reg423Deposits = 0;      // 423レジへの入金総額

        // 金種別の出金・入金追跡
        this.reg422WithdrawalsByDenom = {};
        this.reg422DepositsByDenom = {};
        this.reg423WithdrawalsByDenom = {};
        this.reg423DepositsByDenom = {};
    }

    optimize() {
        this.exchangeSteps = [];

        // 423レジの硬貨不足と余剰を確認
        const result423 = this.analyze423Register();

        // エラーがあれば終了
        if (result423.hasError) {
            return this.exchangeSteps;
        }

        // 423レジの両替が不要な場合でも、422レジのLC処理（両替機補充）は必要
        if (result423.noExchangeNeeded) {
            // 422レジの棒金チェック（LAが空なので空のオブジェクトを渡す）
            this.check422RollsNeeded({});

            // 422レジの両替機利用（LC）を分析
            const { LC, totalLC } = this.analyze422ExchangeMachineNeeds({});

            if (Object.keys(LC).length > 0 && totalLC > 0) {
                // 硬貨合計チェックと再計算
                const coinCheckResult = this.check422CoinsTotal(LC, totalLC);

                // LCの情報を表示
                this.exchangeSteps.push({
                    step: this.exchangeSteps.length + 1,
                    action: '📊 グループC (LC) - 422レジの両替機で補充が必要',
                    details: coinCheckResult.LC,
                    total: coinCheckResult.totalLC,
                    info: `LC合計: ¥${coinCheckResult.totalLC.toLocaleString()}, 硬貨合計: ¥${coinCheckResult.finalCoinsTotal.toLocaleString()}`
                });

                // 422レジ用の両替機処理を実行（入金情報を保存）
                const deposit422Info = this.process422ExchangeMachine(coinCheckResult.LC, coinCheckResult.totalLC);

                // 422レジへ入金
                if (deposit422Info) {
                    this.reg422Deposits += deposit422Info.withdrawalAmount;
                    this.trackDeposit(422, deposit422Info.machineWithdrawalCounts);
                    this.exchangeSteps.push({
                        step: this.exchangeSteps.length + 1,
                        action: '💰 422レジへ入金',
                        details: deposit422Info.machineWithdrawal,
                        total: deposit422Info.withdrawalAmount,
                        info: `両替機からの出金を422レジへ入金`,
                        isUserAction: true
                    });
                }
            } else {
                this.exchangeSteps.push({
                    step: this.exchangeSteps.length + 1,
                    action: '✅ 422レジも補充不要',
                    details: '422レジの硬貨・棒金も全て目標レベル以上です。',
                    total: null
                });
            }

            return this.exchangeSteps;
        }

        // 422レジの不足と余剰を確認
        const result422 = this.analyze422Register();

        // 422レジに十分な在庫があるか確認し、出金額を調整
        if (result423.shortages && result422.inventory) {
            this.adjustWithdrawalAmount(result423, result422);
        }

        // 注: 423レジからの出金は adjustWithdrawalAmount() 内で既に実行済み
        // executeWithdrawal423() の呼び出しは削除（重複出金を防ぐため）

        return this.exchangeSteps;
    }

    // 出金を追跡（金種別）
    trackWithdrawal(register, details) {
        const trackingMap = register === 422 ? this.reg422WithdrawalsByDenom : this.reg423WithdrawalsByDenom;
        const regObj = register === 422 ? this.reg422 : this.reg423;

        for (const [denom, count] of Object.entries(details)) {
            const denomNum = parseInt(denom);
            if (!trackingMap[denomNum]) {
                trackingMap[denomNum] = 0;
            }
            trackingMap[denomNum] += count;

            // 実際のレジスタ残高を更新
            if (denomNum >= 1000) {
                // 紙幣
                if (denomNum === 10000) {
                    regObj.bills10000 -= count;
                } else if (denomNum === 5000) {
                    regObj.bills5000 -= count;
                } else if (denomNum === 1000) {
                    regObj.bills1000 -= count;
                }
            } else {
                // 硬貨：バラから優先的に出金
                const currentCoins = regObj.getCoinCount(denomNum);
                if (currentCoins >= count) {
                    // バラで足りる場合
                    regObj.setCoinCount(denomNum, currentCoins - count);
                } else {
                    // バラで足りない場合は棒金を崩す
                    const shortage = count - currentCoins;
                    const rollsNeeded = Math.ceil(shortage / 50);
                    const currentRolls = regObj.getRollCount(denomNum);

                    if (currentRolls >= rollsNeeded) {
                        // 棒金を崩してバラにする
                        regObj.setRollCount(denomNum, currentRolls - rollsNeeded);
                        const newCoins = currentCoins + (rollsNeeded * 50) - count;
                        regObj.setCoinCount(denomNum, newCoins);
                    } else {
                        // 在庫不足（エラー）
                        console.error(`${denomNum}円の在庫不足: 必要${count}枚、在庫${currentCoins + currentRolls * 50}枚`);
                    }
                }
            }
        }
    }

    // 入金を追跡（金種別）
    trackDeposit(register, details) {
        const trackingMap = register === 422 ? this.reg422DepositsByDenom : this.reg423DepositsByDenom;
        const regObj = register === 422 ? this.reg422 : this.reg423;

        for (const [denom, count] of Object.entries(details)) {
            const denomNum = parseInt(denom);
            if (!trackingMap[denomNum]) {
                trackingMap[denomNum] = 0;
            }
            trackingMap[denomNum] += count;

            // 実際のレジスタ残高を更新
            if (denomNum >= 1000) {
                // 紙幣
                if (denomNum === 10000) {
                    regObj.bills10000 += count;
                } else if (denomNum === 5000) {
                    regObj.bills5000 += count;
                } else if (denomNum === 1000) {
                    regObj.bills1000 += count;
                }
            } else {
                // 硬貨：バラとして入金
                const currentCoins = regObj.getCoinCount(denomNum);
                regObj.setCoinCount(denomNum, currentCoins + count);
            }
        }
    }

    // 423レジの硬貨・紙幣不足と余剰を分析
    analyze423Register() {
        const coinDenoms = [500, 100, 50, 10, 5, 1];
        const shortages = {};
        let totalShortage = 0;

        // 1. 不足している紙幣と枚数を特定
        if (this.reg423.bills5000 < TARGET_5000) {
            const shortage = TARGET_5000 - this.reg423.bills5000;
            shortages[5000] = shortage;
            totalShortage += shortage * 5000;
        }
        if (this.reg423.bills1000 < TARGET_1000) {
            const shortage = TARGET_1000 - this.reg423.bills1000;
            shortages[1000] = shortage;
            totalShortage += shortage * 1000;
        }

        // 2. 不足している硬貨と枚数を特定
        for (const denom of coinDenoms) {
            const current = this.reg423.getCoinCount(denom);
            if (current < TARGET_COINS) {
                const shortage = TARGET_COINS - current;
                shortages[denom] = shortage;
                totalShortage += shortage * denom;
            }
        }

        // 不足がなければ423レジの両替は不要（ただし422レジのLC処理は必要な場合がある）
        if (totalShortage === 0) {
            this.exchangeSteps.push({
                step: 1,
                action: '✅ 423レジ両替不要',
                details: '423レジの硬貨・紙幣は全て目標レベル以上です。422レジの両替機補充を確認します。',
                total: null
            });
            return { hasError: false, noExchangeNeeded: true };
        }

        // 不足情報を記録
        this.exchangeSteps.push({
            step: 1,
            action: '📊 423レジ 不足金種の確認',
            details: shortages,
            total: totalShortage,
            info: `不足金種合計: ¥${totalShortage.toLocaleString()}`
        });

        // 2. 余剰がある硬貨と紙幣を確認
        const surpluses = {};

        // 紙幣の余剰確認
        if (this.reg423.bills10000 > 0) {
            surpluses[10000] = this.reg423.bills10000;
        }
        if (this.reg423.bills5000 > TARGET_5000) {
            surpluses[5000] = this.reg423.bills5000 - TARGET_5000;
        }
        if (this.reg423.bills1000 > TARGET_1000) {
            surpluses[1000] = this.reg423.bills1000 - TARGET_1000;
        }

        // 硬貨の余剰確認（不足していない硬貨のみ）
        for (const denom of coinDenoms) {
            if (!(denom in shortages)) {
                const current = this.reg423.getCoinCount(denom);
                if (current > TARGET_COINS) {
                    surpluses[denom] = current - TARGET_COINS;
                }
            }
        }

        // 余剰情報を記録
        if (Object.keys(surpluses).length > 0) {
            let surplusTotal = 0;
            for (const [denom, count] of Object.entries(surpluses)) {
                surplusTotal += parseInt(denom) * count;
            }
            this.exchangeSteps.push({
                step: 2,
                action: '📊 423レジ 余剰金種の確認',
                details: surpluses,
                total: surplusTotal,
                info: `余剰金種合計: ¥${surplusTotal.toLocaleString()}`
            });
        } else {
            this.exchangeSteps.push({
                step: 2,
                action: '❌ エラー',
                details: '423レジに余剰金種がありません。',
                total: null
            });
            return { hasError: true };
        }

        return {
            hasError: false,
            surpluses: surpluses,
            totalShortage: totalShortage,
            shortages: shortages
        };
    }

    // 423レジから出金を実行
    executeWithdrawal423(result) {
        const combination = result.combination;

        // 出金手順を記録
        this.exchangeSteps.push({
            step: this.exchangeSteps.length + 1,
            action: '423レジから出金（硬貨不足解消のため）',
            details: combination.breakdown,
            total: combination.amount,
            info: `出金枚数: ${combination.totalCoins}枚（最小枚数の組み合わせ）`
        });

        // 在高を更新
        for (const [denom, count] of Object.entries(combination.breakdown)) {
            const denomNum = parseInt(denom);
            const current = this.reg423.getCoinCount(denomNum);
            this.reg423.setCoinCount(denomNum, current - count);
        }
    }

    // 422レジの不足と余剰を分析
    analyze422Register() {
        const coinDenoms = [500, 100, 50, 10, 5, 1];
        const shortages = {};
        const surpluses = {};
        const inventory = {};
        let totalShortage = 0;
        let totalSurplus = 0;

        // 紙幣の在庫と余剰を確認
        inventory[10000] = this.reg422.bills10000;
        inventory[5000] = this.reg422.bills5000;
        inventory[1000] = this.reg422.bills1000;

        // 5000円札の余剰確認（最低保有枚数を考慮）
        if (this.reg422.bills5000 > MIN_HOLD_5000) {
            const surplus = this.reg422.bills5000 - MIN_HOLD_5000;
            surpluses[5000] = {
                surplus: surplus,
                current: this.reg422.bills5000,
                detail: `現在${this.reg422.bills5000}枚 (最低保有${MIN_HOLD_5000}枚)`
            };
            totalSurplus += surplus * 5000;
        }

        // 1000円札の余剰確認（最低保有枚数を考慮）
        if (this.reg422.bills1000 > MIN_HOLD_1000) {
            const surplus = this.reg422.bills1000 - MIN_HOLD_1000;
            surpluses[1000] = {
                surplus: surplus,
                current: this.reg422.bills1000,
                detail: `現在${this.reg422.bills1000}枚 (最低保有${MIN_HOLD_1000}枚)`
            };
            totalSurplus += surplus * 1000;
        }

        // 各硬貨の不足と余剰を確認（棒金を含む）
        for (const denom of coinDenoms) {
            const coins = this.reg422.getCoinCount(denom);
            const rolls = this.reg422.getRollCount(denom);
            const totalCoins = coins + (rolls * 50); // 棒金1本 = 50枚

            // 在庫情報を保存
            inventory[denom] = totalCoins;

            if (totalCoins < TARGET_COINS) {
                const shortage = TARGET_COINS - totalCoins;
                shortages[denom] = {
                    shortage: shortage,
                    current: totalCoins,
                    detail: `バラ${coins}枚 + 棒金${rolls}本(${rolls * 50}枚)`
                };
                totalShortage += shortage * denom;
            } else if (totalCoins > TARGET_COINS) {
                const surplus = totalCoins - TARGET_COINS;
                surpluses[denom] = {
                    surplus: surplus,
                    current: totalCoins,
                    detail: `バラ${coins}枚 + 棒金${rolls}本(${rolls * 50}枚)`
                };
                totalSurplus += surplus * denom;
            }
        }

        // 余剰情報のみ記録（不足情報は423への供給後に表示）
        // 注：この余剰は50枚目標に対するもので、LC（両替機）判断用
        if (Object.keys(surpluses).length > 0) {
            const surplusDetails = {};
            for (const [denom, info] of Object.entries(surpluses)) {
                surplusDetails[denom] = `余剰${info.surplus}枚 (現在${info.current}枚: ${info.detail})`;
            }
            this.exchangeSteps.push({
                step: this.exchangeSteps.length + 1,
                action: '📊 422レジ 余剰金種の確認 (LC判断用)',
                details: surplusDetails,
                total: totalSurplus,
                info: `余剰金種合計（50枚目標超過分）: ¥${totalSurplus.toLocaleString()}`
            });
        }

        return {
            inventory: inventory,
            shortages: shortages,
            surpluses: surpluses,
            totalShortage: totalShortage
        };
    }

    // 422レジの在庫を考慮して423レジの出金額を調整
    adjustWithdrawalAmount(result423, result422) {
        const allDenoms = [10000, 5000, 1000, 500, 100, 50, 10, 5, 1];
        const coinDenoms = [500, 100, 50, 10, 5, 1];
        let iteration = 0;
        const MAX_ITERATIONS = 10;

        // 423レジの不足金種（紙幣と硬貨の両方を含む）
        const shortages423All = { ...result423.shortages };

        // 最終的なLBを保存
        let finalLB = {};

        // 反復ループ開始
        while (iteration < MAX_ITERATIONS) {
            iteration++;

            // LAとLBを初期化
            const LA = {}; // 422レジが補える金種
            const LB = {}; // 422レジが補えない金種（両替機使用）
            let totalLA = 0;
            let totalLB = 0;

            // 強制両替機使用フラグを取得
            const forceExchangeBills = document.getElementById('force-exchange-bills').checked;

            // 422レジの余剰を確認してLA/LBに分類
            for (const denom of allDenoms) {
                if (shortages423All[denom]) {
                    const shortage = shortages423All[denom];
                    const inventory422 = result422.inventory[denom] || 0;

                    if (denom >= 1000) {
                        // 紙幣の場合

                        // 強制両替機使用モードの場合、紙幣は全てLBへ
                        if (forceExchangeBills && (denom === 5000 || denom === 1000)) {
                            LB[denom] = shortage;
                            totalLB += shortage * denom;
                        } else {
                            // 通常モード：最低保有枚数を考慮した余剰計算
                            const minHolding = denom === 5000 ? MIN_HOLD_5000 : MIN_HOLD_1000;

                            // 422レジの真の供給可能余剰を計算 (現在の在庫 - 最低保有枚数)
                            const surplusAvailable = Math.max(0, inventory422 - minHolding);

                            // 供給可能余剰が423レジの不足を賄えるかチェック
                            if (surplusAvailable >= shortage) {
                                // 賄える場合: LAに追加
                                LA[denom] = shortage;
                                totalLA += shortage * denom;
                            } else {
                                // 賄えない場合: LBに追加
                                LB[denom] = shortage;
                                totalLB += shortage * denom;
                            }
                        }
                    } else {
                        // 硬貨の場合：供給後に20枚以上残るかチェック
                        const totalCoins422 = inventory422;

                        // 供給後、20枚以上残るかチェック（50枚目標は無関係）
                        if (totalCoins422 - shortage >= MIN_LOOSE_COINS) {
                            // 供給可能 → LA
                            LA[denom] = shortage;
                            totalLA += shortage * denom;
                        } else {
                            // 供給不可 → LB
                            LB[denom] = shortage;
                            totalLB += shortage * denom;
                        }
                    }
                }
            }

            // LAとLBの情報を表示
            if (iteration === 1) {
                if (Object.keys(LA).length > 0) {
                    const laDetails = {};
                    for (const [denom, shortage] of Object.entries(LA)) {
                        const inventory = result422.inventory[parseInt(denom)] || 0;
                        const afterSupply = inventory - shortage;
                        laDetails[denom] = `不足${shortage}枚 (422在庫: ${inventory}枚 → 供給後: ${afterSupply}枚)`;
                    }
                    this.exchangeSteps.push({
                        step: this.exchangeSteps.length + 1,
                        action: '📊 グループA (LA) - 422レジから423レジへ供給可能な金種',
                        details: laDetails,
                        total: totalLA,
                        info: `LA合計: ¥${totalLA.toLocaleString()}（供給後も422レジに20枚以上残る金種）`
                    });
                }

                if (Object.keys(LB).length > 0) {
                    const lbDetails = {};
                    for (const [denom, shortage] of Object.entries(LB)) {
                        const inventory = result422.inventory[parseInt(denom)] || 0;
                        // 強制モードで紙幣の場合は理由を変更
                        if (forceExchangeBills && (parseInt(denom) === 5000 || parseInt(denom) === 1000)) {
                            lbDetails[denom] = `不足${shortage}枚 (強制両替機モード)`;
                        } else {
                            lbDetails[denom] = `不足${shortage}枚 (422在庫: ${inventory}枚 - 不十分)`;
                        }
                    }
                    const actionLabel = forceExchangeBills
                        ? '📊 グループB (LB) - 両替機で対応が必要な金種 ⚠️強制モード'
                        : '📊 グループB (LB) - 両替機で対応が必要な金種';
                    this.exchangeSteps.push({
                        step: this.exchangeSteps.length + 1,
                        action: actionLabel,
                        details: lbDetails,
                        total: totalLB,
                        info: forceExchangeBills
                            ? `LB合計: ¥${totalLB.toLocaleString()}（紙幣は強制的に両替機使用）`
                            : `LB合計: ¥${totalLB.toLocaleString()}`
                    });

                    // 最終的なLBを保存
                    finalLB = { ...LB };
                }
            }

            // LAが空の場合
            if (Object.keys(LA).length === 0 || totalLA === 0) {
                // LBのみがある場合
                if (Object.keys(finalLB).length > 0) {
                    // 423レジからLB分を出金
                    const lbResult = this.calculateLBWithdrawal(finalLB);
                    if (lbResult.error) {
                        this.exchangeSteps.push({
                            step: this.exchangeSteps.length + 1,
                            action: '❌ エラー',
                            details: lbResult.error,
                            total: null
                        });
                        result423.combination = null;
                        return;
                    }

                    this.reg423Withdrawals += lbResult.withdrawalAmount;
                    this.trackWithdrawal(423, { 10000: lbResult.bills10000Needed });
                    this.exchangeSteps.push({
                        step: this.exchangeSteps.length + 1,
                        action: '✅ 423レジから出金（LB分のみ）',
                        details: { 10000: lbResult.bills10000Needed },
                        total: lbResult.withdrawalAmount,
                        info: `LB: ¥${lbResult.withdrawalAmount.toLocaleString()}`,
                        isUserAction: true
                    });

                    // 422レジの棒金チェック（LAが空なので空のオブジェクトを渡す）
                    this.check422RollsNeeded({});

                    // 422レジの両替機利用（LC）を分析
                    const { LC, totalLC } = this.analyze422ExchangeMachineNeeds({});

                    let deposit422Info = null;
                    if (Object.keys(LC).length > 0 && totalLC > 0) {
                        // 硬貨合計チェックと再計算
                        const coinCheckResult = this.check422CoinsTotal(LC, totalLC);

                        // LCの情報を表示
                        this.exchangeSteps.push({
                            step: this.exchangeSteps.length + 1,
                            action: '📊 グループC (LC) - 422レジの両替機で補充が必要',
                            details: coinCheckResult.LC,
                            total: coinCheckResult.totalLC,
                            info: `LC合計: ¥${coinCheckResult.totalLC.toLocaleString()}, 硬貨合計: ¥${coinCheckResult.finalCoinsTotal.toLocaleString()}`
                        });

                        // 422レジ用の両替機処理を実行（入金情報を保存）
                        deposit422Info = this.process422ExchangeMachine(coinCheckResult.LC, coinCheckResult.totalLC);
                    }

                    // 423レジの両替機処理を実行（入金情報を保存）
                    const deposit423Info = this.processExchangeMachine(finalLB, lbResult.withdrawalAmount);

                    // 422レジへ入金（両替機処理の後）
                    if (deposit422Info) {
                        this.reg422Deposits += deposit422Info.withdrawalAmount;
                        this.trackDeposit(422, deposit422Info.machineWithdrawalCounts);
                        this.exchangeSteps.push({
                            step: this.exchangeSteps.length + 1,
                            action: '💰 422レジへ入金',
                            details: deposit422Info.machineWithdrawal,
                            total: deposit422Info.withdrawalAmount,
                            info: `両替機からの出金を422レジへ入金`,
                            isUserAction: true
                        });
                    }

                    // 423レジへ入金（422レジの後）
                    if (deposit423Info) {
                        this.reg423Deposits += deposit423Info.withdrawalAmount;
                        this.trackDeposit(423, deposit423Info.machineWithdrawal);
                        this.exchangeSteps.push({
                            step: this.exchangeSteps.length + 1,
                            action: '💰 423レジへ入金',
                            details: deposit423Info.machineWithdrawal,
                            total: deposit423Info.withdrawalAmount,
                            info: `両替機からの出金を423レジへ入金`,
                            isUserAction: true
                        });
                    }
                } else {
                    this.exchangeSteps.push({
                        step: this.exchangeSteps.length + 1,
                        action: '⚠️ 終了',
                        details: '422レジで補える金種がありません。全て両替機での対応が必要です。',
                        total: null
                    });
                }
                result423.combination = null;
                return;
            }

            // 423レジの余剰金種を取得（LAに含まれる不足金種は除外）
            const surpluses423 = {};

            // 10000円札は常に余剰として使える（目標レベルがないため）
            if (this.reg423.bills10000 > 0) {
                surpluses423[10000] = this.reg423.bills10000;
            }

            // 5000円札: 不足している場合は除外
            if (!(5000 in shortages423All) && this.reg423.bills5000 > TARGET_5000) {
                surpluses423[5000] = this.reg423.bills5000 - TARGET_5000;
            }

            // 1000円札: 不足している場合は除外
            if (!(1000 in shortages423All) && this.reg423.bills1000 > TARGET_1000) {
                surpluses423[1000] = this.reg423.bills1000 - TARGET_1000;
            }

            // 硬貨: 不足している場合は除外
            for (const denom of coinDenoms) {
                if (!(denom in shortages423All)) {
                    const current = this.reg423.getCoinCount(denom);
                    if (current > TARGET_COINS) {
                        surpluses423[denom] = current - TARGET_COINS;
                    }
                }
            }

            // 統一探索ロジック適用
            const combination = this.determineOptimalWithdrawal(totalLA, surpluses423);

            if (!combination) {
                // デバッグ情報: 余剰金種の内訳を表示
                const surplusDetails = {};
                for (const [denom, count] of Object.entries(surpluses423)) {
                    surplusDetails[denom] = `${count}枚`;
                }

                this.exchangeSteps.push({
                    step: this.exchangeSteps.length + 1,
                    action: '❌ エラー',
                    details: `LA合計¥${totalLA.toLocaleString()}を423レジの余剰金種で作ることができません。余剰金種: ${JSON.stringify(surplusDetails)}`,
                    total: null
                });
                result423.combination = null;
                return;
            }

            // 仮確定した出金額で422レジが補えるか確認
            // 出金で使われる金種ではなく、LAの各金種について422が供給できるかチェック
            let canSupply = true;
            const insufficientDenoms = [];

            for (const [denom, shortage] of Object.entries(LA)) {
                const denomNum = parseInt(denom);
                const inventory = result422.inventory[denomNum] || 0;

                if (denomNum < 1000) {
                    // 硬貨の場合は(在庫 - 不足) >= 20を確認
                    if (inventory - shortage < 20) {
                        canSupply = false;
                        insufficientDenoms.push(denomNum);
                    }
                } else {
                    // 紙幣の場合は最低保有枚数を考慮
                    const minHolding = denomNum === 5000 ? MIN_HOLD_5000 : MIN_HOLD_1000;
                    const surplusAvailable = Math.max(0, inventory - minHolding);

                    if (surplusAvailable < shortage) {
                        canSupply = false;
                        insufficientDenoms.push(denomNum);
                    }
                }
            }

            // 補える場合は確定
            if (canSupply) {
                // 1. 423レジからLA+LB出金（紙幣のみ）
                const combinedWithdrawal = { ...combination.breakdown };
                let combinedTotal = combination.amount;
                let lbWithdrawalAmount = 0; // LB用に423レジから出金した金額を保存

                // LBがある場合は一緒に出金額を計算
                if (Object.keys(finalLB).length > 0) {
                    // LB用の10000円札の計算
                    const lbResult = this.calculateLBWithdrawal(finalLB);
                    if (lbResult.error) {
                        this.exchangeSteps.push({
                            step: this.exchangeSteps.length + 1,
                            action: '❌ エラー',
                            details: lbResult.error,
                            total: null
                        });
                        result423.combination = null;
                        return;
                    }

                    // 10000円札を合算
                    if (combinedWithdrawal[10000]) {
                        combinedWithdrawal[10000] += lbResult.bills10000Needed;
                    } else {
                        combinedWithdrawal[10000] = lbResult.bills10000Needed;
                    }
                    combinedTotal += lbResult.withdrawalAmount;
                    lbWithdrawalAmount = lbResult.withdrawalAmount; // 保存
                }

                this.reg423Withdrawals += combinedTotal;
                this.trackWithdrawal(423, combinedWithdrawal);
                this.exchangeSteps.push({
                    step: this.exchangeSteps.length + 1,
                    action: '✅ 423レジから出金（LA + LB分）',
                    details: combinedWithdrawal,
                    total: combinedTotal,
                    info: `LA: ¥${combination.amount.toLocaleString()}, LB: ¥${(combinedTotal - combination.amount).toLocaleString()}`,
                    isUserAction: true
                });

                // 2. LAを422レジへ入金指示
                this.reg422Deposits += combination.amount;
                this.trackDeposit(422, combination.breakdown);
                this.exchangeSteps.push({
                    step: this.exchangeSteps.length + 1,
                    action: '📥 LAを422レジへ入金指示',
                    details: combination.breakdown,
                    total: combination.amount,
                    info: `LA分（¥${combination.amount.toLocaleString()}）を422レジへ`,
                    isUserAction: true
                });

                // 2.5. 422→423へのLA移動前に、バラ硬貨が10枚以下になる場合は棒金を崩す
                const coinDenoms = [500, 100, 50, 10, 5, 1];
                for (const denom of coinDenoms) {
                    const count = LA[denom] || 0;
                    if (count > 0) {
                        const currentCoins = this.reg422.getCoinCount(denom);
                        const afterMoveCoins = currentCoins - count;

                        // 移動後のバラ枚数が10枚以下になり、かつ棒金が1本以上ある場合
                        if (afterMoveCoins <= 10 && this.reg422.getRollCount(denom) > 0) {
                            // 棒金を崩す指示を追加
                            const breakDetails = {};
                            breakDetails[denom] = `422レジの${denom}円棒金を1本崩してください`;
                            this.exchangeSteps.push({
                                step: this.exchangeSteps.length + 1,
                                action: '🗞️ 422レジ LA移動前の棒金崩し',
                                details: breakDetails,
                                total: null,
                                info: `422レジの${denom}円棒金を1本崩してください`,
                                isUserAction: true
                            });

                            // データ更新：棒金を崩す（棒金-1本、バラ+50枚）
                            this.reg422.setCoinCount(denom, currentCoins + 50);
                            this.reg422.setRollCount(denom, this.reg422.getRollCount(denom) - 1);

                            // 入金追跡マップを更新（レジスタ残高は上で更新済みなので、追跡のみ）
                            // 注：trackDeposit()を使うとレジスタ残高が二重更新されるため、ここでは手動更新
                            if (!this.reg422DepositsByDenom[denom]) {
                                this.reg422DepositsByDenom[denom] = 0;
                            }
                            this.reg422DepositsByDenom[denom] += 50;
                        }
                    }
                }

                // 3. 422レジからLA出金指示
                this.reg422Withdrawals += totalLA;
                this.trackWithdrawal(422, LA);
                this.exchangeSteps.push({
                    step: this.exchangeSteps.length + 1,
                    action: '📤 422レジからLA出金指示',
                    details: LA,
                    total: totalLA,
                    info: `423レジの不足金種（LA: ¥${totalLA.toLocaleString()}）を422レジから出金`,
                    isUserAction: true
                });

                // 4. 423レジへLA入金指示
                this.reg423Deposits += totalLA;
                this.trackDeposit(423, LA);
                this.exchangeSteps.push({
                    step: this.exchangeSteps.length + 1,
                    action: '💰 423レジへLA入金',
                    details: LA,
                    total: totalLA,
                    info: `422レジから出金したLA分を423レジへ入金`,
                    isUserAction: true
                });

                // 423への供給後、422の不足情報を表示
                if (Object.keys(result422.shortages).length > 0) {
                    const shortageDetails = {};
                    for (const [denom, info] of Object.entries(result422.shortages)) {
                        shortageDetails[denom] = `不足${info.shortage}枚 (現在${info.current}枚: ${info.detail})`;
                    }
                    this.exchangeSteps.push({
                        step: this.exchangeSteps.length + 1,
                        action: '📊 422レジ 不足金種の確認',
                        details: shortageDetails,
                        total: result422.totalShortage,
                        info: `不足金種合計: ¥${result422.totalShortage.toLocaleString()}`
                    });
                }

                // 5. 422レジの棒金チェック
                this.check422RollsNeeded(LA);

                // 6. 422レジの両替機利用（LC）を分析
                const { LC, totalLC } = this.analyze422ExchangeMachineNeeds(LA);

                let deposit422Info = null;
                if (Object.keys(LC).length > 0 && totalLC > 0) {
                    // 硬貨合計チェックと再計算
                    const coinCheckResult = this.check422CoinsTotal(LC, totalLC);

                    // LCの情報を表示
                    this.exchangeSteps.push({
                        step: this.exchangeSteps.length + 1,
                        action: '📊 グループC (LC) - 422レジの両替機で補充が必要',
                        details: coinCheckResult.LC,
                        total: coinCheckResult.totalLC,
                        info: `LC合計: ¥${coinCheckResult.totalLC.toLocaleString()}, 硬貨合計: ¥${coinCheckResult.finalCoinsTotal.toLocaleString()}`
                    });

                    // 422レジ用の両替機処理を実行（入金情報を保存）
                    deposit422Info = this.process422ExchangeMachine(coinCheckResult.LC, coinCheckResult.totalLC);
                }

                // 8. LBがある場合は423レジの両替機処理を実行（入金情報を保存）
                let deposit423Info = null;
                if (Object.keys(finalLB).length > 0) {
                    deposit423Info = this.processExchangeMachine(finalLB, lbWithdrawalAmount);
                }

                // 9. 422レジへ入金（両替機処理の後）
                if (deposit422Info) {
                    this.reg422Deposits += deposit422Info.withdrawalAmount;
                    this.trackDeposit(422, deposit422Info.machineWithdrawalCounts);
                    this.exchangeSteps.push({
                        step: this.exchangeSteps.length + 1,
                        action: '💰 422レジへ入金',
                        details: deposit422Info.machineWithdrawal,
                        total: deposit422Info.withdrawalAmount,
                        info: `両替機からの出金を422レジへ入金`,
                        isUserAction: true
                    });
                }

                // 10. おつり返却処理（422レジへの入金後）
                if (combination.amount > totalLA) {
                    const changeAmount = combination.amount - totalLA;
                    this.returnChangeFrom422To423(changeAmount);
                }

                // 11. 423レジへ入金（おつり返却の後）
                if (deposit423Info) {
                    this.reg423Deposits += deposit423Info.withdrawalAmount;
                    this.trackDeposit(423, deposit423Info.machineWithdrawal);
                    this.exchangeSteps.push({
                        step: this.exchangeSteps.length + 1,
                        action: '💰 423レジへ入金',
                        details: deposit423Info.machineWithdrawal,
                        total: deposit423Info.withdrawalAmount,
                        info: `両替機からの出金を423レジへ入金`,
                        isUserAction: true
                    });
                }

                result423.combination = combination;
                result423.totalShortage = totalLA;

                return;
            }

            // 補えない場合はLAからLBへ移動して再計算
            this.exchangeSteps.push({
                step: this.exchangeSteps.length + 1,
                action: `⚠️ 再計算 (反復${iteration}回目)`,
                details: `422レジで補えない金種をLBへ移動: ${insufficientDenoms.map(d => `¥${d}`).join(', ')}`,
                total: null
            });

            // 不足している金種をLAからLBへ移動
            for (const denom of insufficientDenoms) {
                if (LA[denom]) {
                    LB[denom] = LA[denom];
                    delete LA[denom];
                }
            }

            // 次のイテレーションのためにshortages423Allを更新
            // （実際にはLAに残った金種のみを対象とする）
            const newShortages = {};
            for (const [denom, shortage] of Object.entries(shortages423All)) {
                if (!insufficientDenoms.includes(parseInt(denom))) {
                    newShortages[denom] = shortage;
                }
            }

            // 移動した金種をshortages423Allから削除
            for (const denom of insufficientDenoms) {
                delete shortages423All[denom];
            }
        }

        // 最大反復回数に達した場合
        this.exchangeSteps.push({
            step: this.exchangeSteps.length + 1,
            action: '❌ エラー',
            details: '最大反復回数に達しました。最適な出金額を決定できません。',
            total: null
        });
        result423.combination = null;
    }

    // LB用の出金額を計算（423レジ用両替機）
    calculateLBWithdrawal(LB) {
        // LB金種を棒金に調整
        const adjustedLB = {};
        let totalLB = 0;

        // 100円未満の硬貨を棒金に調整
        const smallCoins = [50, 10, 5, 1];
        let smallCoinTotal = 0;

        for (const denom of smallCoins) {
            if (LB[denom]) {
                adjustedLB[denom] = 50; // 棒金1本 = 50枚
                smallCoinTotal += 50 * denom;
            }
        }

        // 100円の倍数チェック（50円余るかどうか）
        if (smallCoinTotal % 100 !== 0) {
            // 50円余る場合、1円を2本(100枚)に変更
            if (adjustedLB[1]) {
                adjustedLB[1] = 100; // 1円を2本
                smallCoinTotal += 50; // 50円追加
            }
        }

        // 100円以上の金種はそのまま
        if (LB[500]) {
            adjustedLB[500] = LB[500];
            totalLB += LB[500] * 500;
        }
        if (LB[100]) {
            adjustedLB[100] = LB[100];
            totalLB += LB[100] * 100;
        }
        if (LB[1000]) {
            adjustedLB[1000] = LB[1000];
            totalLB += LB[1000] * 1000;
        }
        if (LB[5000]) {
            adjustedLB[5000] = LB[5000];
            totalLB += LB[5000] * 5000;
        }

        totalLB += smallCoinTotal;

        // 10000円単位に切り上げ
        const withdrawalAmount = Math.ceil(totalLB / 10000) * 10000;

        // 10000円札の在庫確認
        const bills10000Needed = withdrawalAmount / 10000;
        if (this.reg423.bills10000 < bills10000Needed) {
            return {
                error: `423レジの10000円札が不足しています。必要: ${bills10000Needed}枚、在庫: ${this.reg423.bills10000}枚`
            };
        }

        return {
            adjustedLB,
            totalLB,
            withdrawalAmount,
            bills10000Needed
        };
    }

    // 422レジの棒金チェック（LA出金後にバラ硬貨が20枚以下になる金種を確認）
    check422RollsNeeded(LA) {
        const coinDenoms = [500, 100, 50, 10, 5, 1];
        const rollsToBreak = [];
        const coinsNeedingRolls = [];

        for (const denom of coinDenoms) {
            const currentLoose = this.reg422.getCoinCount(denom);
            const withdrawal = LA[denom] || 0;
            const afterWithdrawal = currentLoose - withdrawal;

            // LA出金後にバラ硬貨が20枚未満になる場合
            if (afterWithdrawal < MIN_LOOSE_COINS) {
                const currentRolls = this.reg422.getRollCount(denom);
                if (currentRolls > 0) {
                    rollsToBreak.push({
                        denom: denom,
                        currentLoose: currentLoose,
                        withdrawal: withdrawal,
                        afterWithdrawal: afterWithdrawal,
                        availableRolls: currentRolls
                    });
                } else {
                    coinsNeedingRolls.push({
                        denom: denom,
                        currentLoose: currentLoose,
                        withdrawal: withdrawal,
                        afterWithdrawal: afterWithdrawal
                    });
                }
            }
        }

        // 棒金を崩す必要がある金種を表示
        if (rollsToBreak.length > 0) {
            const details = {};
            for (const item of rollsToBreak) {
                details[item.denom] = `バラ${item.currentLoose}枚 → LA出金${item.withdrawal}枚 → 残${item.afterWithdrawal}枚 (棒金${item.availableRolls}本を崩す)`;
            }
            this.exchangeSteps.push({
                step: this.exchangeSteps.length + 1,
                action: '🗞️ 422レジ 棒金を崩す必要がある金種',
                details: details,
                total: null,
                info: `LA出金後にバラ硬貨が${MIN_LOOSE_COINS}枚以下になるため、棒金を崩してください`
            });
        }

        // 棒金が不足している金種を表示（両替機で補充が必要）
        if (coinsNeedingRolls.length > 0) {
            const details = {};
            for (const item of coinsNeedingRolls) {
                details[item.denom] = `バラ${item.currentLoose}枚 → LA出金${item.withdrawal}枚 → 残${item.afterWithdrawal}枚 (棒金なし)`;
            }
            this.exchangeSteps.push({
                step: this.exchangeSteps.length + 1,
                action: '⚠️ 422レジ 棒金不足',
                details: details,
                total: null,
                info: '両替機で補充が必要です'
            });
        }

        return { rollsToBreak, coinsNeedingRolls };
    }

    // 422レジの両替機利用（LC: 棒金・紙幣補充）
    analyze422ExchangeMachineNeeds(LA) {
        const coinDenoms = [500, 100, 50, 10, 5, 1];
        const LC = {}; // 両替機で補充が必要な金種
        let totalLC = 0;

        // LA出金後の紙幣枚数を計算
        const bills5000After = this.reg422.bills5000 - (LA[5000] || 0);
        const bills1000After = this.reg422.bills1000 - (LA[1000] || 0);

        // ユーザーが設定した目標枚数を取得
        const target5000 = parseInt(document.getElementById('target-bills-5000').value) || 30;
        const target1000 = parseInt(document.getElementById('target-bills-1000').value) || 60;

        // 5000円札のチェック
        if (bills5000After < target5000) {
            const shortage = target5000 - bills5000After;
            LC[5000] = shortage;
            totalLC += shortage * 5000;
        }

        // 1000円札のチェック
        if (bills1000After < target1000) {
            const shortage = target1000 - bills1000After;
            LC[1000] = shortage;
            totalLC += shortage * 1000;
        }

        // 硬貨の棒金チェック（1円・5円は後で調整するため一旦スキップ）
        let need1YenRoll = false;
        let need5YenRoll = false;

        for (const denom of coinDenoms) {
            const currentRolls = this.reg422.getRollCount(denom);
            let needRolls = 0;

            if (denom === 1) {
                // 1円: 棒金が1本以下の場合（後で調整）
                if (currentRolls <= 1) {
                    need1YenRoll = true;
                }
            } else if (denom === 5) {
                // 5円: 棒金が0本の場合（後で調整）
                if (currentRolls === 0) {
                    need5YenRoll = true;
                }
            } else if (denom === 500 || denom === 50) {
                // 500円/50円: 棒金が0本の場合（単独で出金可能）
                if (currentRolls === 0) {
                    needRolls = 1;
                }
            } else {
                // 100円/10円: 棒金が1本以下の場合、2本になるまで補充（単独で出金可能）
                if (currentRolls <= 1) {
                    needRolls = 2 - currentRolls; // 0本→2本追加、1本→1本追加
                }
            }

            if (needRolls > 0) {
                LC[denom] = 50 * needRolls; // 棒金1本 = 50枚
                totalLC += denom * 50 * needRolls;
            }
        }

        // 1円・5円棒金の調整（両替機の制約: 50円の端数を作らない）
        // 1円棒金 = 50円、5円棒金 = 250円
        // 有効な組み合わせ: 1円2本(100円)、5円2本(500円)、1円1本+5円1本(300円)
        if (need1YenRoll || need5YenRoll) {
            if (need1YenRoll && need5YenRoll) {
                // 両方必要: 1円1本 + 5円1本 = 300円
                LC[1] = 50;
                LC[5] = 50;
                totalLC += 50 + 250; // 300円
            } else if (need1YenRoll && !need5YenRoll) {
                // 1円のみ必要: 1円2本 = 100円
                LC[1] = 100;
                totalLC += 100;
            } else if (!need1YenRoll && need5YenRoll) {
                // 5円のみ必要: 5円2本 = 500円
                LC[5] = 100;
                totalLC += 500;
            }
        }

        // LC合計が50円の端数を含む場合の最終調整
        // （上記の1円・5円処理で50円端数は解消されているはず）
        const remainder = totalLC % 100;
        if (remainder === 50) {
            // 50円の端数がある場合、1円棒金を追加して100円にする
            LC[1] = (LC[1] || 0) + 50;
            totalLC += 50;
        }

        return { LC, totalLC };
    }

    // 422レジの硬貨合計をチェックし、必要に応じて500円/100円棒金を追加
    check422CoinsTotal(LC, totalLC) {
        // 現在の422レジの硬貨合計（バラ+棒金）を計算
        const coinDenoms = [500, 100, 50, 10, 5, 1];
        let currentCoinsTotal = 0;

        for (const denom of coinDenoms) {
            const coins = this.reg422.getCoinCount(denom);
            const rolls = this.reg422.getRollCount(denom);
            currentCoinsTotal += (coins + rolls * 50) * denom;
        }

        // LCで追加される硬貨を加算
        for (const [denom, count] of Object.entries(LC)) {
            const denomNum = parseInt(denom);
            if (denomNum < 1000) {
                currentCoinsTotal += denomNum * count;
            }
        }

        // 83250円未満の場合、500円棒金を追加
        let additionalRolls = { ...LC };
        let additionalTotal = totalLC;

        if (currentCoinsTotal < TARGET_422_COINS_TOTAL) {
            const shortage = TARGET_422_COINS_TOTAL - currentCoinsTotal;

            // 500円棒金の現在の本数を確認
            const current500Rolls = this.reg422.getRollCount(500);
            const lc500Rolls = Math.floor((LC[500] || 0) / 50);
            const total500Rolls = current500Rolls + lc500Rolls;

            // 500円棒金を追加できる場合
            if (total500Rolls < MAX_ROLLS_500) {
                const maxAdd500 = MAX_ROLLS_500 - total500Rolls;
                const needed500Rolls = Math.ceil(shortage / (500 * 50));
                const add500Rolls = Math.min(needed500Rolls, maxAdd500);

                if (add500Rolls > 0) {
                    additionalRolls[500] = (additionalRolls[500] || 0) + (add500Rolls * 50);
                    additionalTotal += add500Rolls * 500 * 50;
                    currentCoinsTotal += add500Rolls * 500 * 50;
                }
            }

            // まだ不足している場合、500円のバラ枚数をチェック
            if (currentCoinsTotal < TARGET_422_COINS_TOTAL) {
                const current500Coins = this.reg422.getCoinCount(500); // 500円のバラ枚数
                const current500RollsNow = this.reg422.getRollCount(500);
                const lc500RollsNow = Math.floor((additionalRolls[500] || 0) / 50);
                const total500RollsNow = current500RollsNow + lc500RollsNow;

                // 500円のバラが30枚未満 かつ 棒金が3本未満の場合、500円棒金を3本まで追加可能
                if (current500Coins < 30 && total500RollsNow < 3) {
                    const maxAdd500Extra = 3 - total500RollsNow; // 3本まで追加可能
                    const remainingShortage = TARGET_422_COINS_TOTAL - currentCoinsTotal;
                    const needed500RollsExtra = Math.ceil(remainingShortage / (500 * 50));
                    const add500RollsExtra = Math.min(needed500RollsExtra, maxAdd500Extra);

                    if (add500RollsExtra > 0) {
                        additionalRolls[500] = (additionalRolls[500] || 0) + (add500RollsExtra * 50);
                        additionalTotal += add500RollsExtra * 500 * 50;
                        currentCoinsTotal += add500RollsExtra * 500 * 50;
                    }
                }
            }

            // まだ不足している場合、100円棒金を追加
            if (currentCoinsTotal < TARGET_422_COINS_TOTAL) {
                const remainingShortage = TARGET_422_COINS_TOTAL - currentCoinsTotal;

                const current100Rolls = this.reg422.getRollCount(100);
                const lc100Rolls = Math.floor((additionalRolls[100] || 0) / 50);
                const total100Rolls = current100Rolls + lc100Rolls;

                if (total100Rolls < MAX_ROLLS_100) {
                    const maxAdd100 = MAX_ROLLS_100 - total100Rolls;
                    const needed100Rolls = Math.ceil(remainingShortage / (100 * 50));
                    const add100Rolls = Math.min(needed100Rolls, maxAdd100);

                    if (add100Rolls > 0) {
                        additionalRolls[100] = (additionalRolls[100] || 0) + (add100Rolls * 50);
                        additionalTotal += add100Rolls * 100 * 50;
                        currentCoinsTotal += add100Rolls * 100 * 50;
                    }
                }
            }

            // まだ不足している場合は警告
            if (currentCoinsTotal < TARGET_422_COINS_TOTAL) {
                this.exchangeSteps.push({
                    step: this.exchangeSteps.length + 1,
                    action: '⚠️ 警告',
                    details: `422レジの硬貨合計が目標額に達しません: 現在¥${currentCoinsTotal.toLocaleString()} < 目標¥${TARGET_422_COINS_TOTAL.toLocaleString()}`,
                    total: null,
                    info: '棒金の上限に達しているため、これ以上追加できません'
                });
            }
        }

        return { LC: additionalRolls, totalLC: additionalTotal, finalCoinsTotal: currentCoinsTotal };
    }

    // 422レジ用の両替機処理を実行
    process422ExchangeMachine(LC, totalLC) {
        if (!LC || Object.keys(LC).length === 0 || totalLC === 0) {
            return;
        }

        // 棒金の上限チェックと特別ルールの情報表示
        const warnings = [];
        const specialRuleInfo = [];
        const coinDenoms = [500, 100, 50, 10, 5, 1];

        for (const denom of coinDenoms) {
            if (LC[denom]) {
                const addRolls = Math.floor(LC[denom] / 50);
                const currentRolls = this.reg422.getRollCount(denom);
                const totalRolls = currentRolls + addRolls;

                const maxRolls = (denom === 500 || denom === 50 || denom === 5) ? MAX_ROLLS_500 : MAX_ROLLS_100;

                // 500円の特別ルール：バラが30枚未満の場合は3本まで許可
                if (denom === 500 && totalRolls === 3) {
                    const current500Coins = this.reg422.getCoinCount(500);
                    if (current500Coins < 30) {
                        // 特別ルール適用：警告ではなく情報として表示
                        specialRuleInfo.push(`500円硬貨のバラが${current500Coins}枚のため、棒金を3本まで追加 (通常上限2本 → 特別ルール適用)`);
                        continue; // 警告には追加しない
                    }
                }

                if (totalRolls > maxRolls) {
                    warnings.push(`¥${denom}: 棒金上限超過 (現在${currentRolls}本 + 追加${addRolls}本 = ${totalRolls}本 > 上限${maxRolls}本)`);
                }
            }
        }

        // 特別ルール適用の情報表示
        if (specialRuleInfo.length > 0) {
            this.exchangeSteps.push({
                step: this.exchangeSteps.length + 1,
                action: 'ℹ️ 棒金追加（特別ルール）',
                details: specialRuleInfo.reduce((acc, info, i) => ({ ...acc, [i + 1]: info }), {}),
                total: null,
                info: '500円バラ不足のため、通常上限を超えて棒金を追加します'
            });
        }

        // 上限超過の警告表示
        if (warnings.length > 0) {
            this.exchangeSteps.push({
                step: this.exchangeSteps.length + 1,
                action: '⚠️ 棒金上限警告',
                details: warnings.reduce((acc, w, i) => ({ ...acc, [i + 1]: w }), {}),
                total: null,
                info: '棒金の保管上限を超えています'
            });
        }

        // LCを棒金とバラに分けて調整（50枚単位は棒金、端数はバラ）
        const adjustedLC = {};
        const rollDetails = []; // 棒金とバラの詳細を文字列で記録
        let adjustedTotal = 0;

        // 全金種を処理（硬貨も紙幣も）
        const allDenoms = [5000, 1000, 500, 100, 50, 10, 5, 1];

        for (const denom of allDenoms) {
            if (LC[denom]) {
                const totalCoins = LC[denom];
                const rolls = Math.floor(totalCoins / 50); // 棒金の本数
                const loose = totalCoins % 50; // バラの枚数

                // 棒金とバラの内訳を文字列化
                if (rolls > 0 && loose > 0) {
                    rollDetails.push(`¥${denom}: 棒金${rolls}本 + バラ${loose}枚`);
                } else if (rolls > 0) {
                    rollDetails.push(`¥${denom}: 棒金${rolls}本`);
                } else if (loose > 0) {
                    rollDetails.push(`¥${denom}: バラ${loose}枚`);
                }

                // adjustedLCには合計枚数を設定（従来通り）
                adjustedLC[denom] = totalCoins;
                adjustedTotal += totalCoins * denom;
            }
        }

        // 10000円単位に切り上げ
        const withdrawalAmount = Math.ceil(adjustedTotal / 10000) * 10000;

        // 10000円札の在庫確認（422レジから）
        const bills10000Needed = withdrawalAmount / 10000;
        if (this.reg422.bills10000 < bills10000Needed) {
            this.exchangeSteps.push({
                step: this.exchangeSteps.length + 1,
                action: '❌ エラー',
                details: `422レジの10000円札が不足しています。必要: ${bills10000Needed}枚、在庫: ${this.reg422.bills10000}枚`,
                total: null
            });
            return;
        }

        // おつり計算
        const changeAmount = withdrawalAmount - adjustedTotal;
        const change = this.calculateChange(changeAmount);

        // 両替機からの出金内訳（LC + おつり）を棒金とバラ形式で作成
        const machineWithdrawalCounts = { ...adjustedLC };
        for (const [denom, count] of Object.entries(change)) {
            machineWithdrawalCounts[denom] = (machineWithdrawalCounts[denom] || 0) + count;
        }

        // 表示用に棒金とバラの形式に変換
        const machineWithdrawal = {};
        for (const [denom, totalCount] of Object.entries(machineWithdrawalCounts)) {
            const denomNum = parseInt(denom);
            const rolls = Math.floor(totalCount / 50);
            const loose = totalCount % 50;

            // 硬貨（1000円未満）の場合は棒金とバラ形式で表示
            if (denomNum < 1000) {
                if (rolls > 0 && loose > 0) {
                    machineWithdrawal[denom] = `${rolls}本+${loose}枚(${totalCount}枚)`;
                } else if (rolls > 0) {
                    machineWithdrawal[denom] = `${rolls}本(${totalCount}枚)`;
                } else {
                    machineWithdrawal[denom] = `${loose}枚`;
                }
            } else {
                // 紙幣の場合は枚数のみ
                machineWithdrawal[denom] = totalCount;
            }
        }

        // 手順を表示
        this.reg422Withdrawals += withdrawalAmount;
        this.trackWithdrawal(422, { 10000: bills10000Needed });
        this.exchangeSteps.push({
            step: this.exchangeSteps.length + 1,
            action: '💵 422レジから出金（両替機用 - LC）',
            details: { 10000: bills10000Needed },
            total: withdrawalAmount,
            info: `10000円札 ${bills10000Needed}枚を出金`,
            isUserAction: true
        });

        this.exchangeSteps.push({
            step: this.exchangeSteps.length + 1,
            action: '🏧 両替機へ入金（422レジ用）',
            details: { 10000: bills10000Needed },
            total: withdrawalAmount,
            info: `両替機に ¥${withdrawalAmount.toLocaleString()}を入金`,
            isUserAction: true
        });

        // 棒金とバラの詳細を info に追加
        let rollDetailsInfo = '';
        if (rollDetails.length > 0) {
            rollDetailsInfo = '\n【棒金・バラ内訳】\n' + rollDetails.join('\n');
        }

        this.exchangeSteps.push({
            step: this.exchangeSteps.length + 1,
            action: '🏧 両替機から出金（422レジ用）',
            details: machineWithdrawal,
            total: withdrawalAmount,
            info: `LC金種 ¥${adjustedTotal.toLocaleString()} + おつり ¥${changeAmount.toLocaleString()}${rollDetailsInfo}`,
            isUserAction: true
        });

        // 入金情報を返す（後で入金処理を実行するため）
        return {
            withdrawalAmount: withdrawalAmount,
            machineWithdrawalCounts: machineWithdrawalCounts,
            machineWithdrawal: machineWithdrawal
        };
    }

    // 両替機を使用してLB金種を両替（423レジ用）
    // withdrawalAmount: 既に423レジから出金済みの金額（手順6で出金済み）
    processExchangeMachine(LB, withdrawalAmount) {
        if (!LB || Object.keys(LB).length === 0) {
            return;
        }

        // LB金種を棒金に調整
        const adjustedLB = {};
        let totalLB = 0;

        // 100円未満の硬貨を棒金に調整
        const smallCoins = [50, 10, 5, 1];
        let smallCoinTotal = 0;

        for (const denom of smallCoins) {
            if (LB[denom]) {
                adjustedLB[denom] = 50; // 棒金1本 = 50枚
                smallCoinTotal += 50 * denom;
            }
        }

        // 100円の倍数チェック（50円余るかどうか）
        if (smallCoinTotal % 100 !== 0) {
            // 50円余る場合、1円を2本(100枚)に変更
            if (adjustedLB[1]) {
                adjustedLB[1] = 100; // 1円を2本
                smallCoinTotal += 50; // 50円追加
            }
        }

        // 100円以上の金種はそのまま
        if (LB[500]) {
            adjustedLB[500] = LB[500];
            totalLB += LB[500] * 500;
        }
        if (LB[100]) {
            adjustedLB[100] = LB[100];
            totalLB += LB[100] * 100;
        }
        if (LB[1000]) {
            adjustedLB[1000] = LB[1000];
            totalLB += LB[1000] * 1000;
        }
        if (LB[5000]) {
            adjustedLB[5000] = LB[5000];
            totalLB += LB[5000] * 5000;
        }

        totalLB += smallCoinTotal;

        // おつり計算
        const changeAmount = withdrawalAmount - totalLB;
        const change = this.calculateChange(changeAmount);

        // 両替機からの出金内訳（LB + おつり）
        const machineWithdrawal = { ...adjustedLB };
        for (const [denom, count] of Object.entries(change)) {
            machineWithdrawal[denom] = (machineWithdrawal[denom] || 0) + count;
        }

        // 手順を表示（423レジからの出金は手順6で既に完了しているため、両替機処理のみ）
        const bills10000Needed = withdrawalAmount / 10000;

        this.exchangeSteps.push({
            step: this.exchangeSteps.length + 1,
            action: '🏧 両替機へ入金（423レジ用）',
            details: { 10000: bills10000Needed },
            total: withdrawalAmount,
            info: `両替機に ${withdrawalAmount.toLocaleString()}円を入金`,
            isUserAction: true
        });

        this.exchangeSteps.push({
            step: this.exchangeSteps.length + 1,
            action: '🏧 両替機から出金（423レジ用）',
            details: machineWithdrawal,
            total: withdrawalAmount,
            info: `LB金種 ¥${totalLB.toLocaleString()} + おつり ¥${changeAmount.toLocaleString()}`,
            isUserAction: true
        });

        // 入金情報を返す（後で入金処理を実行するため）
        return {
            withdrawalAmount: withdrawalAmount,
            machineWithdrawal: machineWithdrawal
        };
    }

    // おつりを計算（5000円以下、大きい額面優先）
    calculateChange(amount) {
        const change = {};
        let remaining = amount;
        const denoms = [5000, 1000, 500, 100];

        for (const denom of denoms) {
            if (remaining >= denom) {
                const count = Math.floor(remaining / denom);
                change[denom] = count;
                remaining -= count * denom;
            }
        }

        return change;
    }

    // 422レジから423レジへおつりを返却
    returnChangeFrom422To423(changeAmount) {
        if (changeAmount === 0) {
            return;
        }

        // おつりの内訳を計算（貪欲法: 5000円 → 1000円 → 500円 → 100円）
        const changeBreakdown = {};
        let remaining = changeAmount;
        const denoms = [5000, 1000, 500, 100, 50, 10, 5, 1];

        // 422レジの在庫をチェックしながら、大きい金種から優先的に使用
        for (const denom of denoms) {
            if (remaining >= denom) {
                const needed = Math.floor(remaining / denom);

                // 紙幣の場合はバラのみ、硬貨の場合は棒金を含めた総在庫をチェック
                let available;
                if (denom >= 1000) {
                    // 紙幣: バラのみ
                    available = this.reg422.getCoinCount(denom);
                } else {
                    // 硬貨: バラ + 棒金の総在庫
                    const coins = this.reg422.getCoinCount(denom);
                    const rolls = this.reg422.getRollCount(denom);
                    available = coins + (rolls * 50);
                }

                const use = Math.min(needed, available);

                if (use > 0) {
                    changeBreakdown[denom] = use;
                    remaining -= use * denom;
                }
            }
        }

        // おつりが正確に作れない場合はエラー
        if (remaining > 0) {
            this.exchangeSteps.push({
                step: this.exchangeSteps.length + 1,
                action: '❌ エラー',
                details: `422レジの在庫でおつり¥${changeAmount.toLocaleString()}を作ることができません。不足額: ¥${remaining.toLocaleString()}`,
                total: null,
                info: '422レジの金種が不足しています'
            });
            return;
        }

        // おつり返却手順を表示
        this.reg422Withdrawals += changeAmount;
        this.reg423Deposits += changeAmount;
        this.trackWithdrawal(422, changeBreakdown);
        this.trackDeposit(423, changeBreakdown);
        this.exchangeSteps.push({
            step: this.exchangeSteps.length + 1,
            action: '💴 422レジから423レジへおつり返却',
            details: changeBreakdown,
            total: changeAmount,
            info: `LA出金額とLA不足額の差額を返却: ¥${changeAmount.toLocaleString()}`,
            isUserAction: true
        });
    }

    // 統一探索ロジック (Unified Search Logic / U.S.L.)
    determineOptimalWithdrawal(totalShortage, surpluses) {
        // Step 1: 1種類の硬貨・紙幣で金額を作れる場合
        const denomsSorted = Object.keys(surpluses).map(d => parseInt(d)).sort((a, b) => b - a);

        for (const denom of denomsSorted) {
            const available = surpluses[denom];
            if (totalShortage % denom === 0) {
                const needed = totalShortage / denom;
                if (needed <= available) {
                    return {
                        breakdown: { [denom]: needed },
                        amount: totalShortage,
                        totalCoins: needed
                    };
                }
            }
        }

        // Step 2: 余剰金種で作れる最小金額を探す
        // 各金種の倍数で、totalShortage以上の最小値を候補とする
        const candidates = [];

        for (const denom of denomsSorted) {
            const available = surpluses[denom];
            if (available > 0) {
                // この金種だけで作れる最小金額(totalShortage以上)
                const minAmount = Math.ceil(totalShortage / denom) * denom;
                const needed = minAmount / denom;

                // 在庫が十分にあれば候補に追加
                if (needed <= available) {
                    candidates.push({ amount: minAmount, denom: denom });
                }
            }
        }

        // 候補の中から最小金額を選択
        if (candidates.length > 0) {
            candidates.sort((a, b) => a.amount - b.amount);
            const best = candidates[0];

            // 最小候補から貪欲法で試す
            const combination = this.makeAmountGreedy(best.amount, surpluses);
            if (combination) {
                return combination;
            }
        }

        // 候補がない場合は従来の方法
        let target = Math.ceil(totalShortage / 1000) * 1000;
        const increment = denomsSorted.length > 0 ? Math.min(...denomsSorted.filter(d => surpluses[d] > 0)) : 1000;

        // Step 3: ジャンプアップ調整ループ
        const maxTotalValue = this.getTotalValue(surpluses);
        const MAX_ATTEMPTS = 100;
        let attempts = 0;

        while (target <= maxTotalValue && attempts < MAX_ATTEMPTS) {
            attempts++;

            // 貪欲法で構成可能か試す
            const combination = this.makeAmountGreedy(target, surpluses);

            if (combination) {
                return combination;
            }

            // 作れない場合は、増額単位分を加算してジャンプアップ
            target += increment;
        }

        // どうしても作れない場合は、元の不足金額で試す
        return this.makeAmountGreedy(totalShortage, surpluses);
    }

    // 在庫の合計金額を計算
    getTotalValue(surpluses) {
        let total = 0;
        for (const [denom, count] of Object.entries(surpluses)) {
            total += parseInt(denom) * count;
        }
        return total;
    }

    // 貪欲法で金額を作成（大きい金種から優先的に使用）
    makeAmountGreedy(targetAmount, surpluses) {
        const breakdown = {};
        let remaining = targetAmount;
        let totalCoins = 0;

        // 金種を降順にソート
        const denomsSorted = Object.keys(surpluses).map(d => parseInt(d)).sort((a, b) => b - a);

        for (const denom of denomsSorted) {
            const available = surpluses[denom];
            const needed = Math.floor(remaining / denom);
            const use = Math.min(needed, available);

            if (use > 0) {
                breakdown[denom] = use;
                remaining -= use * denom;
                totalCoins += use;
            }

            if (remaining === 0) {
                break;
            }
        }

        // 金額を正確に作れない場合はnullを返す
        if (remaining > 0) {
            return null;
        }

        return {
            breakdown: breakdown,
            amount: targetAmount,
            totalCoins: totalCoins
        };
    }
}

// UIイベントハンドラー
document.querySelectorAll('input[type="number"]').forEach(input => {
    input.addEventListener('input', updateTotals);
});

function updateTotals() {
    // 422レジの小計と合計を更新
    let totalBills422 = 0;
    let totalCoins422 = 0;

    const subtotals422 = {
        '10000': parseInt(document.getElementById('reg422-bills-10000').value || 0) * 10000,
        '5000': parseInt(document.getElementById('reg422-bills-5000').value || 0) * 5000,
        '1000': parseInt(document.getElementById('reg422-bills-1000').value || 0) * 1000,
        'coins-500': parseInt(document.getElementById('reg422-coins-500').value || 0) * 500,
        'coins-100': parseInt(document.getElementById('reg422-coins-100').value || 0) * 100,
        'coins-50': parseInt(document.getElementById('reg422-coins-50').value || 0) * 50,
        'coins-10': parseInt(document.getElementById('reg422-coins-10').value || 0) * 10,
        'coins-5': parseInt(document.getElementById('reg422-coins-5').value || 0) * 5,
        'coins-1': parseInt(document.getElementById('reg422-coins-1').value || 0) * 1,
        'rolls-500': parseInt(document.getElementById('reg422-rolls-500').value || 0) * 500 * 50,
        'rolls-100': parseInt(document.getElementById('reg422-rolls-100').value || 0) * 100 * 50,
        'rolls-50': parseInt(document.getElementById('reg422-rolls-50').value || 0) * 50 * 50,
        'rolls-10': parseInt(document.getElementById('reg422-rolls-10').value || 0) * 10 * 50,
        'rolls-5': parseInt(document.getElementById('reg422-rolls-5').value || 0) * 5 * 50,
        'rolls-1': parseInt(document.getElementById('reg422-rolls-1').value || 0) * 1 * 50
    };

    for (const [key, value] of Object.entries(subtotals422)) {
        document.getElementById(`subtotal-422-${key}`).textContent = `¥${value.toLocaleString()}`;

        // 紙幣と硬貨を分類
        if (key === '10000' || key === '5000' || key === '1000') {
            totalBills422 += value;
        } else {
            totalCoins422 += value;
        }
    }

    document.getElementById('total-bills-422').textContent = `紙幣: ¥${totalBills422.toLocaleString()}`;
    document.getElementById('total-coins-422').textContent = `硬貨: ¥${totalCoins422.toLocaleString()}`;

    // 423レジの小計と合計を更新
    let totalBills423 = 0;
    let totalCoins423 = 0;

    const subtotals423 = {
        '10000': parseInt(document.getElementById('reg423-bills-10000').value || 0) * 10000,
        '5000': parseInt(document.getElementById('reg423-bills-5000').value || 0) * 5000,
        '1000': parseInt(document.getElementById('reg423-bills-1000').value || 0) * 1000,
        'coins-500': parseInt(document.getElementById('reg423-coins-500').value || 0) * 500,
        'coins-100': parseInt(document.getElementById('reg423-coins-100').value || 0) * 100,
        'coins-50': parseInt(document.getElementById('reg423-coins-50').value || 0) * 50,
        'coins-10': parseInt(document.getElementById('reg423-coins-10').value || 0) * 10,
        'coins-5': parseInt(document.getElementById('reg423-coins-5').value || 0) * 5,
        'coins-1': parseInt(document.getElementById('reg423-coins-1').value || 0) * 1
    };

    for (const [key, value] of Object.entries(subtotals423)) {
        document.getElementById(`subtotal-423-${key}`).textContent = `¥${value.toLocaleString()}`;

        // 紙幣と硬貨を分類
        if (key === '10000' || key === '5000' || key === '1000') {
            totalBills423 += value;
        } else {
            totalCoins423 += value;
        }
    }

    document.getElementById('total-bills-423').textContent = `紙幣: ¥${totalBills423.toLocaleString()}`;
    document.getElementById('total-coins-423').textContent = `硬貨: ¥${totalCoins423.toLocaleString()}`;
}

function getInventoryFromUI() {
    const reg422 = new CashInventory();
    reg422.bills10000 = parseInt(document.getElementById('reg422-bills-10000').value || 0);
    reg422.bills5000 = parseInt(document.getElementById('reg422-bills-5000').value || 0);
    reg422.bills1000 = parseInt(document.getElementById('reg422-bills-1000').value || 0);
    reg422.coins500 = parseInt(document.getElementById('reg422-coins-500').value || 0);
    reg422.coins100 = parseInt(document.getElementById('reg422-coins-100').value || 0);
    reg422.coins50 = parseInt(document.getElementById('reg422-coins-50').value || 0);
    reg422.coins10 = parseInt(document.getElementById('reg422-coins-10').value || 0);
    reg422.coins5 = parseInt(document.getElementById('reg422-coins-5').value || 0);
    reg422.coins1 = parseInt(document.getElementById('reg422-coins-1').value || 0);
    reg422.rolls500 = parseInt(document.getElementById('reg422-rolls-500').value || 0);
    reg422.rolls100 = parseInt(document.getElementById('reg422-rolls-100').value || 0);
    reg422.rolls50 = parseInt(document.getElementById('reg422-rolls-50').value || 0);
    reg422.rolls10 = parseInt(document.getElementById('reg422-rolls-10').value || 0);
    reg422.rolls5 = parseInt(document.getElementById('reg422-rolls-5').value || 0);
    reg422.rolls1 = parseInt(document.getElementById('reg422-rolls-1').value || 0);

    const reg423 = new CashInventory();
    reg423.bills10000 = parseInt(document.getElementById('reg423-bills-10000').value || 0);
    reg423.bills5000 = parseInt(document.getElementById('reg423-bills-5000').value || 0);
    reg423.bills1000 = parseInt(document.getElementById('reg423-bills-1000').value || 0);
    reg423.coins500 = parseInt(document.getElementById('reg423-coins-500').value || 0);
    reg423.coins100 = parseInt(document.getElementById('reg423-coins-100').value || 0);
    reg423.coins50 = parseInt(document.getElementById('reg423-coins-50').value || 0);
    reg423.coins10 = parseInt(document.getElementById('reg423-coins-10').value || 0);
    reg423.coins5 = parseInt(document.getElementById('reg423-coins-5').value || 0);
    reg423.coins1 = parseInt(document.getElementById('reg423-coins-1').value || 0);

    return [reg422, reg423];
}

function optimizeCash() {
    const button = document.querySelector('.btn-optimize');
    button.classList.add('optimizing');
    button.disabled = true;

    setTimeout(() => {
        const [reg422, reg423] = getInventoryFromUI();
        const optimizer = new CashExchangeOptimizer(reg422, reg423);
        const steps = optimizer.optimize();

        displayResults(steps, optimizer);

        // 問題報告用にoptimizerを保存
        currentOptimizer = optimizer;

        button.classList.remove('optimizing');
        button.disabled = false;
    }, 500);
}

function displayResults(steps, optimizer) {
    const resultArea = document.getElementById('result-area');
    const stepsContainer = document.getElementById('steps-container');
    const summaryContainer = document.getElementById('summary-container');

    // ステップを表示
    stepsContainer.innerHTML = '';

    for (const step of steps) {
        const stepDiv = document.createElement('div');
        // 作業手順の場合は色を変える
        stepDiv.className = step.isUserAction ? 'step step-action' : 'step';

        let detailsHtml = '';
        if (typeof step.details === 'object' && step.details !== null) {
            for (const [key, value] of Object.entries(step.details)) {
                // 値が数値の場合は「枚」を付ける、文字列の場合はそのまま表示
                if (typeof value === 'number') {
                    detailsHtml += `<div>• ¥${key}: ${value}枚</div>`;
                } else {
                    detailsHtml += `<div>• ¥${key}: ${value}</div>`;
                }
            }
        } else if (typeof step.details === 'string') {
            detailsHtml = `<div>${step.details}</div>`;
        }

        let totalHtml = '';
        if (step.total !== null && step.total !== undefined) {
            totalHtml = `<div class="step-total">合計: ¥${step.total.toLocaleString()}</div>`;
        }

        let infoHtml = '';
        if (step.info) {
            infoHtml = `<div class="step-info">${step.info}</div>`;
        }

        stepDiv.innerHTML = `
            <div class="step-header">【手順${step.step}】 ${step.action}</div>
            <div class="step-details">
                ${detailsHtml}
                ${totalHtml}
                ${infoHtml}
            </div>
        `;

        stepsContainer.appendChild(stepDiv);
    }

    // 出金・入金の総和と最終在高を表示
    summaryContainer.innerHTML = generateSummary(optimizer);

    resultArea.style.display = 'block';
}

function generateSummary(optimizer) {
    const reg422Diff = optimizer.reg422Deposits - optimizer.reg422Withdrawals;
    const reg423Diff = optimizer.reg423Deposits - optimizer.reg423Withdrawals;

    // 最終在高の計算（初期在高 + 入金 - 出金）
    const finalBalances422 = calculateFinalBalance(
        optimizer.initialReg422,
        optimizer.reg422DepositsByDenom,
        optimizer.reg422WithdrawalsByDenom,
        optimizer.reg422  // 棒金の最終状態を渡す
    );
    const finalBalances423 = calculateFinalBalance(
        optimizer.initialReg423,
        optimizer.reg423DepositsByDenom,
        optimizer.reg423WithdrawalsByDenom,
        null  // 423レジには棒金がない
    );

    return `
        <div class="transaction-summary">
            <h4>💰 各レジの出金・入金総和</h4>
            <div class="balance-grid">
                <div>
                    <h5>422レジ</h5>
                    <div class="transaction-item">
                        <span>出金総額:</span>
                        <span>¥${optimizer.reg422Withdrawals.toLocaleString()}</span>
                    </div>
                    <div class="transaction-item">
                        <span>入金総額:</span>
                        <span>¥${optimizer.reg422Deposits.toLocaleString()}</span>
                    </div>
                    <div class="transaction-item">
                        <span>差額:</span>
                        <span class="${reg422Diff === 0 ? 'transaction-ok' : 'transaction-ng'}">
                            ${reg422Diff >= 0 ? '+' : ''}¥${reg422Diff.toLocaleString()}
                            ${reg422Diff === 0 ? ' ✓' : ' ⚠'}
                        </span>
                    </div>
                </div>
                <div>
                    <h5>423レジ</h5>
                    <div class="transaction-item">
                        <span>出金総額:</span>
                        <span>¥${optimizer.reg423Withdrawals.toLocaleString()}</span>
                    </div>
                    <div class="transaction-item">
                        <span>入金総額:</span>
                        <span>¥${optimizer.reg423Deposits.toLocaleString()}</span>
                    </div>
                    <div class="transaction-item">
                        <span>差額:</span>
                        <span class="${reg423Diff === 0 ? 'transaction-ok' : 'transaction-ng'}">
                            ${reg423Diff >= 0 ? '+' : ''}¥${reg423Diff.toLocaleString()}
                            ${reg423Diff === 0 ? ' ✓' : ' ⚠'}
                        </span>
                    </div>
                </div>
            </div>
        </div>

        <div class="final-balance">
            <h3>📊 最終的な現金在高</h3>
            <div class="balance-grid">
                <div class="balance-register">
                    <h4>📦 422レジ</h4>
                    ${finalBalances422}
                </div>
                <div class="balance-register">
                    <h4>🏪 423レジ</h4>
                    ${finalBalances423}
                </div>
            </div>
        </div>
    `;
}

function calculateFinalBalance(initialReg, depositsByDenom, withdrawalsByDenom, currentReg = null) {
    // 最終在高を計算: 初期在高 + 入金 - 出金
    const finalReg = {};

    // 紙幣
    finalReg.bills10000 = initialReg.bills10000 + (depositsByDenom[10000] || 0) - (withdrawalsByDenom[10000] || 0);
    finalReg.bills5000 = initialReg.bills5000 + (depositsByDenom[5000] || 0) - (withdrawalsByDenom[5000] || 0);
    finalReg.bills1000 = initialReg.bills1000 + (depositsByDenom[1000] || 0) - (withdrawalsByDenom[1000] || 0);

    // 硬貨
    finalReg.coins500 = initialReg.coins500 + (depositsByDenom[500] || 0) - (withdrawalsByDenom[500] || 0);
    finalReg.coins100 = initialReg.coins100 + (depositsByDenom[100] || 0) - (withdrawalsByDenom[100] || 0);
    finalReg.coins50 = initialReg.coins50 + (depositsByDenom[50] || 0) - (withdrawalsByDenom[50] || 0);
    finalReg.coins10 = initialReg.coins10 + (depositsByDenom[10] || 0) - (withdrawalsByDenom[10] || 0);
    finalReg.coins5 = initialReg.coins5 + (depositsByDenom[5] || 0) - (withdrawalsByDenom[5] || 0);
    finalReg.coins1 = initialReg.coins1 + (depositsByDenom[1] || 0) - (withdrawalsByDenom[1] || 0);

    // 棒金 (422レジのみ) - currentRegが渡された場合は最新の値を使う
    if (initialReg.rolls500 !== undefined) {
        if (currentReg && currentReg.rolls500 !== undefined) {
            // 棒金の最新状態を使用
            finalReg.rolls500 = currentReg.rolls500;
            finalReg.rolls100 = currentReg.rolls100;
            finalReg.rolls50 = currentReg.rolls50;
            finalReg.rolls10 = currentReg.rolls10;
            finalReg.rolls5 = currentReg.rolls5;
            finalReg.rolls1 = currentReg.rolls1;
        } else {
            // 初期値を使用（変更なし）
            finalReg.rolls500 = initialReg.rolls500;
            finalReg.rolls100 = initialReg.rolls100;
            finalReg.rolls50 = initialReg.rolls50;
            finalReg.rolls10 = initialReg.rolls10;
            finalReg.rolls5 = initialReg.rolls5;
            finalReg.rolls1 = initialReg.rolls1;
        }
        finalReg.hasRolls = true;  // 棒金があることを記録
    }

    // HTMLを生成
    let html = '';

    // 紙幣
    html += '<div style="margin-bottom: 10px;"><strong>紙幣</strong></div>';
    if (finalReg.bills10000 > 0) {
        html += `<div class="balance-item"><span class="balance-label">¥10,000:</span><span class="balance-value">${finalReg.bills10000}枚</span></div>`;
    }
    html += `<div class="balance-item"><span class="balance-label">¥5,000:</span><span class="balance-value">${finalReg.bills5000}枚</span></div>`;
    html += `<div class="balance-item"><span class="balance-label">¥1,000:</span><span class="balance-value">${finalReg.bills1000}枚</span></div>`;

    // 硬貨（バラ）
    html += '<div style="margin: 15px 0 10px 0;"><strong>硬貨（バラ）</strong></div>';
    html += `<div class="balance-item"><span class="balance-label">¥500:</span><span class="balance-value">${finalReg.coins500}枚</span></div>`;
    html += `<div class="balance-item"><span class="balance-label">¥100:</span><span class="balance-value">${finalReg.coins100}枚</span></div>`;
    html += `<div class="balance-item"><span class="balance-label">¥50:</span><span class="balance-value">${finalReg.coins50}枚</span></div>`;
    html += `<div class="balance-item"><span class="balance-label">¥10:</span><span class="balance-value">${finalReg.coins10}枚</span></div>`;
    html += `<div class="balance-item"><span class="balance-label">¥5:</span><span class="balance-value">${finalReg.coins5}枚</span></div>`;
    html += `<div class="balance-item"><span class="balance-label">¥1:</span><span class="balance-value">${finalReg.coins1}枚</span></div>`;

    // 棒金 (422レジのみ)
    let rollsTotal = 0;
    if (finalReg.hasRolls) {
        html += '<div style="margin: 15px 0 10px 0;"><strong>棒金</strong></div>';
        html += `<div class="balance-item"><span class="balance-label">¥500棒金:</span><span class="balance-value">${finalReg.rolls500}本</span></div>`;
        html += `<div class="balance-item"><span class="balance-label">¥100棒金:</span><span class="balance-value">${finalReg.rolls100}本</span></div>`;
        html += `<div class="balance-item"><span class="balance-label">¥50棒金:</span><span class="balance-value">${finalReg.rolls50}本</span></div>`;
        html += `<div class="balance-item"><span class="balance-label">¥10棒金:</span><span class="balance-value">${finalReg.rolls10}本</span></div>`;
        html += `<div class="balance-item"><span class="balance-label">¥5棒金:</span><span class="balance-value">${finalReg.rolls5}本</span></div>`;
        html += `<div class="balance-item"><span class="balance-label">¥1棒金:</span><span class="balance-value">${finalReg.rolls1}本</span></div>`;

        // 棒金の合計金額を計算
        rollsTotal = finalReg.rolls500 * 50 * 500 + finalReg.rolls100 * 50 * 100 + finalReg.rolls50 * 50 * 50 +
                     finalReg.rolls10 * 50 * 10 + finalReg.rolls5 * 50 * 5 + finalReg.rolls1 * 50 * 1;
    }

    // 硬貨の小計（バラ + 棒金）
    const coinsTotal = finalReg.coins500 * 500 + finalReg.coins100 * 100 + finalReg.coins50 * 50 +
                       finalReg.coins10 * 10 + finalReg.coins5 * 5 + finalReg.coins1 * 1 + rollsTotal;
    html += `<div class="balance-item" style="margin-top: 10px; padding-top: 10px; border-top: 2px solid #dee2e6;"><span class="balance-label" style="font-weight: bold;">硬貨小計:</span><span class="balance-value" style="color: #007bff;">¥${coinsTotal.toLocaleString()}</span></div>`;

    // 合計金額
    const total = finalReg.bills10000 * 10000 + finalReg.bills5000 * 5000 + finalReg.bills1000 * 1000 + coinsTotal;

    html += `<div class="balance-item"><span class="balance-label">合計:</span><span class="balance-value">¥${total.toLocaleString()}</span></div>`;

    return html;
}

function calculateTotalValue(reg) {
    let total = 0;
    total += reg.bills10000 * 10000;
    total += reg.bills5000 * 5000;
    total += reg.bills1000 * 1000;
    total += reg.getCoinCount(500) * 500;
    total += reg.getCoinCount(100) * 100;
    total += reg.getCoinCount(50) * 50;
    total += reg.getCoinCount(10) * 10;
    total += reg.getCoinCount(5) * 5;
    total += reg.getCoinCount(1) * 1;

    // 棒金 (422レジのみ)
    if (reg.rolls500 !== undefined) {
        total += reg.getRollCount(500) * 50 * 500;
        total += reg.getRollCount(100) * 50 * 100;
        total += reg.getRollCount(50) * 50 * 50;
        total += reg.getRollCount(10) * 50 * 10;
        total += reg.getRollCount(5) * 50 * 5;
        total += reg.getRollCount(1) * 50 * 1;
    }

    return total;
}

function resetAll() {
    document.querySelectorAll('input[type="number"]').forEach(input => {
        const id = input.id;
        // デフォルト値を設定
        if (id === 'reg422-bills-5000' || id === 'reg423-bills-5000') {
            input.value = 20;
        } else if (id === 'reg422-bills-1000' || id === 'reg423-bills-1000') {
            input.value = 40;
        } else if (id.includes('coins-') && (id.startsWith('reg422-') || id.startsWith('reg423-'))) {
            input.value = 50;
        } else if (id === 'reg422-rolls-500' || id === 'reg422-rolls-50' || id === 'reg422-rolls-5') {
            input.value = 1;
        } else if (id === 'reg422-rolls-100' || id === 'reg422-rolls-10' || id === 'reg422-rolls-1') {
            input.value = 4;
        } else {
            input.value = 0;
        }
    });
    updateTotals();
    document.getElementById('result-area').style.display = 'none';
}

// 初期化
updateTotals();

// 問題報告機能
let currentOptimizer = null; // 最後に実行したoptimizerを保存

function reportProblem() {
    if (!currentOptimizer) {
        alert('まず「最適化を実行」を行ってください。');
        return;
    }

    // 送信先メールアドレス（固定）
    const toEmail = 'xiangtailongkou866@gmail.com'; // ここに実際のメールアドレスを設定してください

    // メール件名
    const subject = '残置両替システム - 問題報告';

    // メール本文を生成
    let body = '【残置両替システム 問題報告】\n\n';
    body += '送信者: [ここに名前を記入してください]\n\n';
    body += '=' .repeat(60) + '\n\n';

    // 設定情報
    body += '【設定情報】\n';
    const forceExchange = document.getElementById('force-exchange-bills').checked;
    body += `・423レジ紙幣は強制的に両替機使用: ${forceExchange ? 'ON' : 'OFF'}\n`;
    const target5000 = document.getElementById('target-bills-5000').value;
    const target1000 = document.getElementById('target-bills-1000').value;
    body += `・422レジ紙幣目標枚数（5000円札）: ${target5000}枚以上\n`;
    body += `・422レジ紙幣目標枚数（1000円札）: ${target1000}枚以上\n`;
    body += '\n' + '='.repeat(60) + '\n\n';

    // 初期在高
    body += '【初期在高】\n\n';
    body += '◆422レジ\n';
    body += formatInventory(currentOptimizer.initialReg422, true);
    body += '\n◆423レジ\n';
    body += formatInventory(currentOptimizer.initialReg423, false);
    body += '\n' + '='.repeat(60) + '\n\n';

    // 処理手順
    body += '【処理手順】\n\n';
    currentOptimizer.exchangeSteps.forEach(step => {
        body += `【手順${step.step}】 ${step.action}\n`;
        if (typeof step.details === 'object' && step.details !== null) {
            for (const [key, value] of Object.entries(step.details)) {
                if (typeof value === 'number') {
                    body += `• ¥${key}: ${value}枚\n`;
                } else {
                    body += `• ¥${key}: ${value}\n`;
                }
            }
        } else if (typeof step.details === 'string') {
            body += `${step.details}\n`;
        }
        if (step.total !== null && step.total !== undefined) {
            body += `合計: ¥${step.total.toLocaleString()}\n`;
        }
        if (step.info) {
            body += `${step.info}\n`;
        }
        body += '\n';
    });
    body += '='.repeat(60) + '\n\n';

    // 入出金総和
    body += '【入出金総和】\n\n';
    body += '◆422レジ\n';
    body += `・出金総額: ¥${currentOptimizer.reg422Withdrawals.toLocaleString()}\n`;
    body += `・入金総額: ¥${currentOptimizer.reg422Deposits.toLocaleString()}\n`;
    const diff422 = currentOptimizer.reg422Deposits - currentOptimizer.reg422Withdrawals;
    body += `・差額: ¥${diff422.toLocaleString()}\n\n`;

    body += '◆423レジ\n';
    body += `・出金総額: ¥${currentOptimizer.reg423Withdrawals.toLocaleString()}\n`;
    body += `・入金総額: ¥${currentOptimizer.reg423Deposits.toLocaleString()}\n`;
    const diff423 = currentOptimizer.reg423Deposits - currentOptimizer.reg423Withdrawals;
    body += `・差額: ¥${diff423.toLocaleString()}\n\n`;
    body += '='.repeat(60) + '\n\n';

    // 最終在高
    body += '【最終在高（計算結果）】\n\n';

    // 最終在高を計算（オブジェクトとして）
    const final422 = calculateFinalBalanceObject(
        currentOptimizer.initialReg422,
        currentOptimizer.reg422DepositsByDenom,
        currentOptimizer.reg422WithdrawalsByDenom,
        currentOptimizer.reg422
    );
    const final423 = calculateFinalBalanceObject(
        currentOptimizer.initialReg423,
        currentOptimizer.reg423DepositsByDenom,
        currentOptimizer.reg423WithdrawalsByDenom,
        currentOptimizer.reg423
    );

    body += '◆422レジ\n';
    body += formatFinalBalance(final422);
    body += '\n◆423レジ\n';
    body += formatFinalBalance(final423);
    body += '\n' + '='.repeat(60) + '\n\n';

    body += '【問題の詳細】\n';
    body += '[ここに問題の詳細を記入してください]\n\n';

    // mailto リンクを生成
    const mailtoLink = `mailto:${toEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    // メールクライアントを開く
    window.location.href = mailtoLink;
}

// 最終在高を計算してオブジェクトとして返す（メール報告用）
function calculateFinalBalanceObject(initialReg, depositsByDenom, withdrawalsByDenom, currentReg = null) {
    const finalReg = {};

    // 紙幣
    finalReg.bills10000 = initialReg.bills10000 + (depositsByDenom[10000] || 0) - (withdrawalsByDenom[10000] || 0);
    finalReg.bills5000 = initialReg.bills5000 + (depositsByDenom[5000] || 0) - (withdrawalsByDenom[5000] || 0);
    finalReg.bills1000 = initialReg.bills1000 + (depositsByDenom[1000] || 0) - (withdrawalsByDenom[1000] || 0);

    // 硬貨
    finalReg.coins500 = initialReg.coins500 + (depositsByDenom[500] || 0) - (withdrawalsByDenom[500] || 0);
    finalReg.coins100 = initialReg.coins100 + (depositsByDenom[100] || 0) - (withdrawalsByDenom[100] || 0);
    finalReg.coins50 = initialReg.coins50 + (depositsByDenom[50] || 0) - (withdrawalsByDenom[50] || 0);
    finalReg.coins10 = initialReg.coins10 + (depositsByDenom[10] || 0) - (withdrawalsByDenom[10] || 0);
    finalReg.coins5 = initialReg.coins5 + (depositsByDenom[5] || 0) - (withdrawalsByDenom[5] || 0);
    finalReg.coins1 = initialReg.coins1 + (depositsByDenom[1] || 0) - (withdrawalsByDenom[1] || 0);

    // 棒金 (422レジのみ)
    if (initialReg.rolls500 !== undefined) {
        if (currentReg && currentReg.rolls500 !== undefined) {
            finalReg.rolls500 = currentReg.rolls500;
            finalReg.rolls100 = currentReg.rolls100;
            finalReg.rolls50 = currentReg.rolls50;
            finalReg.rolls10 = currentReg.rolls10;
            finalReg.rolls5 = currentReg.rolls5;
            finalReg.rolls1 = currentReg.rolls1;
        } else {
            finalReg.rolls500 = initialReg.rolls500;
            finalReg.rolls100 = initialReg.rolls100;
            finalReg.rolls50 = initialReg.rolls50;
            finalReg.rolls10 = initialReg.rolls10;
            finalReg.rolls5 = initialReg.rolls5;
            finalReg.rolls1 = initialReg.rolls1;
        }
        finalReg.hasRolls = true;
    }

    return finalReg;
}

// 在高をフォーマット
function formatInventory(reg, hasRolls) {
    let text = '【紙幣】\n';
    text += `  10000円札: ${reg.bills10000}枚\n`;
    text += `  5000円札: ${reg.bills5000}枚\n`;
    text += `  1000円札: ${reg.bills1000}枚\n`;
    text += '【硬貨】\n';
    text += `  500円: ${reg.coins500}枚\n`;
    text += `  100円: ${reg.coins100}枚\n`;
    text += `  50円: ${reg.coins50}枚\n`;
    text += `  10円: ${reg.coins10}枚\n`;
    text += `  5円: ${reg.coins5}枚\n`;
    text += `  1円: ${reg.coins1}枚\n`;

    if (hasRolls) {
        text += '【棒金】\n';
        text += `  500円: ${reg.rolls500}本\n`;
        text += `  100円: ${reg.rolls100}本\n`;
        text += `  50円: ${reg.rolls50}本\n`;
        text += `  10円: ${reg.rolls10}本\n`;
        text += `  5円: ${reg.rolls5}本\n`;
        text += `  1円: ${reg.rolls1}本\n`;
    }

    return text;
}

// 最終在高をフォーマット
function formatFinalBalance(balance) {
    let text = '【紙幣】\n';
    text += `  10000円札: ${balance.bills10000}枚\n`;
    text += `  5000円札: ${balance.bills5000}枚\n`;
    text += `  1000円札: ${balance.bills1000}枚\n`;
    text += '【硬貨（バラ）】\n';
    text += `  500円: ${balance.coins500}枚\n`;
    text += `  100円: ${balance.coins100}枚\n`;
    text += `  50円: ${balance.coins50}枚\n`;
    text += `  10円: ${balance.coins10}枚\n`;
    text += `  5円: ${balance.coins5}枚\n`;
    text += `  1円: ${balance.coins1}枚\n`;

    if (balance.hasRolls) {
        text += '【棒金】\n';
        text += `  500円: ${balance.rolls500}本\n`;
        text += `  100円: ${balance.rolls100}本\n`;
        text += `  50円: ${balance.rolls50}本\n`;
        text += `  10円: ${balance.rolls10}本\n`;
        text += `  5円: ${balance.rolls5}本\n`;
        text += `  1円: ${balance.rolls1}本\n`;
    }

    return text;
}

// ========================================
// 画像アップロード・自動入力機能
// ========================================

// 画像を圧縮する関数
function compressImage(file, maxWidth = 1024, quality = 0.8) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                // 幅が maxWidth より大きい場合は縮小
                if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob((blob) => {
                    resolve(blob);
                }, 'image/jpeg', quality);
            };
            img.onerror = reject;
            img.src = e.target.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

async function uploadImage(input, registerNumber) {
    const file = input.files[0];
    if (!file) return;

    // ローディング表示
    const loadingMsg = document.getElementById(`loadingMsg${registerNumber}`);
    loadingMsg.style.display = 'block';

    try {
        // 画像を圧縮（最大幅1024px、品質0.8）
        const compressedBlob = await compressImage(file, 1024, 0.8);
        console.log(`元のサイズ: ${(file.size / 1024 / 1024).toFixed(2)}MB → 圧縮後: ${(compressedBlob.size / 1024 / 1024).toFixed(2)}MB`);

        const formData = new FormData();
        formData.append("file", compressedBlob, "image.jpg");
        // Pythonバックエンドへ画像を送信
        const res = await fetch("/api/analyze", { method: "POST", body: formData });

        // レスポンスをテキストとして取得（デバッグ用）
        const rawText = await res.text();
        console.log("サーバーレスポンス:", rawText);

        // JSONとしてパース
        let data;
        try {
            data = JSON.parse(rawText);
        } catch (parseError) {
            alert("JSONパースエラー:\n" + parseError.message + "\n\n受信データ:\n" + rawText.substring(0, 200));
            return;
        }

        if (data.error) {
            alert("エラー: " + data.error);
        } else {
            // 自動入力処理
            const denominations = {
                "10000": `reg${registerNumber}-bills-10000`,
                "5000": `reg${registerNumber}-bills-5000`,
                "1000": `reg${registerNumber}-bills-1000`,
                "500": `reg${registerNumber}-coins-500`,
                "100": `reg${registerNumber}-coins-100`,
                "50": `reg${registerNumber}-coins-50`,
                "10": `reg${registerNumber}-coins-10`,
                "5": `reg${registerNumber}-coins-5`,
                "1": `reg${registerNumber}-coins-1`
            };

            // 各入力欄に値を設定
            for (const [key, elementId] of Object.entries(denominations)) {
                const el = document.getElementById(elementId);
                if (el && data[key] !== undefined) {
                    el.value = data[key];
                    el.style.backgroundColor = "#e8f0fe"; // 色を変えて分かりやすく

                    // inputイベントを発火して小計を更新
                    el.dispatchEvent(new Event('input', { bubbles: true }));
                }
            }

            alert("読み取り完了！\n数字が正しいか必ず目視で確認してください。");
        }
    } catch (e) {
        console.error(e);
        alert("通信エラーが発生しました: " + e.message);
    } finally {
        loadingMsg.style.display = 'none';
        input.value = ""; // リセット
    }
}
