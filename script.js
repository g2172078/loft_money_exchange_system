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
    }

    optimize() {
        this.exchangeSteps = [];

        // 423レジの硬貨不足と余剰を確認
        const result423 = this.analyze423Register();

        // エラーがあれば終了
        if (result423.hasError) {
            return this.exchangeSteps;
        }

        // 422レジの不足と余剰を確認
        const result422 = this.analyze422Register();

        // 422レジに十分な在庫があるか確認し、出金額を調整
        if (result423.shortages && result422.inventory) {
            this.adjustWithdrawalAmount(result423, result422);
        }

        // 最後に423レジから出金
        if (result423.combination) {
            this.executeWithdrawal423(result423);
        }

        return this.exchangeSteps;
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

        // 不足がなければ終了
        if (totalShortage === 0) {
            this.exchangeSteps.push({
                step: 1,
                action: '✅ 両替不要',
                details: '423レジの硬貨・紙幣は全て目標レベル以上です。',
                total: null
            });
            return { hasError: true };
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

        // 不足情報を記録
        if (Object.keys(shortages).length > 0) {
            const shortageDetails = {};
            for (const [denom, info] of Object.entries(shortages)) {
                shortageDetails[denom] = `不足${info.shortage}枚 (現在${info.current}枚: ${info.detail})`;
            }
            this.exchangeSteps.push({
                step: this.exchangeSteps.length + 1,
                action: '📊 422レジ 不足金種の確認',
                details: shortageDetails,
                total: totalShortage,
                info: `不足金種合計: ¥${totalShortage.toLocaleString()}`
            });
        }

        // 余剰情報を記録
        if (Object.keys(surpluses).length > 0) {
            const surplusDetails = {};
            for (const [denom, info] of Object.entries(surpluses)) {
                surplusDetails[denom] = `余剰${info.surplus}枚 (現在${info.current}枚: ${info.detail})`;
            }
            this.exchangeSteps.push({
                step: this.exchangeSteps.length + 1,
                action: '📊 422レジ 余剰金種の確認',
                details: surplusDetails,
                total: totalSurplus,
                info: `余剰金種合計: ¥${totalSurplus.toLocaleString()}`
            });
        }

        // 不足も余剰もない場合
        if (Object.keys(shortages).length === 0 && Object.keys(surpluses).length === 0) {
            this.exchangeSteps.push({
                step: this.exchangeSteps.length + 1,
                action: '✅ 422レジ 確認完了',
                details: '422レジの硬貨・紙幣は全て目標レベルです。',
                total: null
            });
        }

        return {
            inventory: inventory,
            shortages: shortages,
            surpluses: surpluses
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

            // 422レジの余剰を確認してLA/LBに分類
            for (const denom of allDenoms) {
                if (shortages423All[denom]) {
                    const shortage = shortages423All[denom];
                    const inventory422 = result422.inventory[denom] || 0;

                    if (denom >= 1000) {
                        // 紙幣の場合：最低保有枚数を考慮した余剰計算
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
                    } else {
                        // 硬貨の場合：(在庫 - 不足) >= 20
                        if (inventory422 - shortage >= 20) {
                            LA[denom] = shortage;
                            totalLA += shortage * denom;
                        } else {
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
                        laDetails[denom] = `不足${shortage}枚 (422在庫: ${inventory}枚)`;
                    }
                    this.exchangeSteps.push({
                        step: this.exchangeSteps.length + 1,
                        action: '📊 グループA (LA) - 422レジで補える金種',
                        details: laDetails,
                        total: totalLA,
                        info: `LA合計: ¥${totalLA.toLocaleString()}`
                    });
                }

                if (Object.keys(LB).length > 0) {
                    const lbDetails = {};
                    for (const [denom, shortage] of Object.entries(LB)) {
                        const inventory = result422.inventory[parseInt(denom)] || 0;
                        lbDetails[denom] = `不足${shortage}枚 (422在庫: ${inventory}枚 - 不十分)`;
                    }
                    this.exchangeSteps.push({
                        step: this.exchangeSteps.length + 1,
                        action: '📊 グループB (LB) - 両替機で対応が必要な金種',
                        details: lbDetails,
                        total: totalLB,
                        info: `LB合計: ¥${totalLB.toLocaleString()}`
                    });

                    // 最終的なLBを保存
                    finalLB = { ...LB };
                }
            }

            // LAが空の場合
            if (Object.keys(LA).length === 0 || totalLA === 0) {
                // LBのみがある場合は両替機処理を実行
                if (Object.keys(finalLB).length > 0) {
                    this.processExchangeMachine(finalLB);
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

            // 423レジの余剰金種を取得
            const surpluses423 = {};
            if (this.reg423.bills10000 > 0) {
                surpluses423[10000] = this.reg423.bills10000;
            }
            if (this.reg423.bills5000 > TARGET_5000) {
                surpluses423[5000] = this.reg423.bills5000 - TARGET_5000;
            }
            if (this.reg423.bills1000 > TARGET_1000) {
                surpluses423[1000] = this.reg423.bills1000 - TARGET_1000;
            }
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
                this.exchangeSteps.push({
                    step: this.exchangeSteps.length + 1,
                    action: '❌ エラー',
                    details: `LA合計¥${totalLA.toLocaleString()}を423レジの余剰金種で作ることができません。`,
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
                this.exchangeSteps.push({
                    step: this.exchangeSteps.length + 1,
                    action: '✅ 出金額確定（LA分）',
                    details: combination.breakdown,
                    total: combination.amount,
                    info: `出金枚数: ${combination.totalCoins}枚（統一探索ロジックにより決定）`
                });
                result423.combination = combination;
                result423.totalShortage = totalLA;

                // LBがある場合は両替機処理を実行
                if (Object.keys(finalLB).length > 0) {
                    this.processExchangeMachine(finalLB);
                }

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

    // 両替機を使用してLB金種を両替
    processExchangeMachine(LB) {
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

        // 10000円単位に切り上げ
        const withdrawalAmount = Math.ceil(totalLB / 10000) * 10000;

        // 10000円札の在庫確認
        const bills10000Needed = withdrawalAmount / 10000;
        if (this.reg423.bills10000 < bills10000Needed) {
            this.exchangeSteps.push({
                step: this.exchangeSteps.length + 1,
                action: '❌ エラー',
                details: `10000円札が不足しています。必要: ${bills10000Needed}枚、在庫: ${this.reg423.bills10000}枚`,
                total: null
            });
            return;
        }

        // おつり計算
        const changeAmount = withdrawalAmount - totalLB;
        const change = this.calculateChange(changeAmount);

        // 両替機からの出金内訳（LB + おつり）
        const machineWithdrawal = { ...adjustedLB };
        for (const [denom, count] of Object.entries(change)) {
            machineWithdrawal[denom] = (machineWithdrawal[denom] || 0) + count;
        }

        // 手順を表示
        this.exchangeSteps.push({
            step: this.exchangeSteps.length + 1,
            action: '💵 423レジから出金（両替機用）',
            details: { 10000: bills10000Needed },
            total: withdrawalAmount,
            info: `10000円札 ${bills10000Needed}枚を出金`
        });

        this.exchangeSteps.push({
            step: this.exchangeSteps.length + 1,
            action: '🏧 両替機へ入金',
            details: { 10000: bills10000Needed },
            total: withdrawalAmount,
            info: `両替機に ${withdrawalAmount.toLocaleString()}円を入金`
        });

        this.exchangeSteps.push({
            step: this.exchangeSteps.length + 1,
            action: '🏧 両替機から出金',
            details: machineWithdrawal,
            total: withdrawalAmount,
            info: `LB金種 ¥${totalLB.toLocaleString()} + おつり ¥${changeAmount.toLocaleString()}`
        });

        this.exchangeSteps.push({
            step: this.exchangeSteps.length + 1,
            action: '💰 423レジへ入金',
            details: machineWithdrawal,
            total: withdrawalAmount,
            info: `両替機からの出金を423レジへ入金`
        });
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

        // Step 2: 初期目標額と増額単位の特定
        let target = Math.ceil(totalShortage / 1000) * 1000;

        // 増額単位 (Increment) の決定：余剰在庫にある最小の紙幣
        const billDenoms = [1000, 5000, 10000];
        let increment = 1000; // デフォルト

        for (const denom of billDenoms) {
            if (surpluses[denom] && surpluses[denom] > 0) {
                increment = denom;
                break;
            }
        }

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

            // 作れない場合は、増額単位の倍数に切り上げてジャンプアップ
            target = Math.ceil(target / increment) * increment;
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
    let total422 = 0;

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
        total422 += value;
    }

    document.getElementById('total-422').textContent = `合計: ¥${total422.toLocaleString()}`;

    // 423レジの小計と合計を更新
    let total423 = 0;

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
        total423 += value;
    }

    document.getElementById('total-423').textContent = `合計: ¥${total423.toLocaleString()}`;
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

        displayResults(steps, optimizer.reg422, optimizer.reg423);

        button.classList.remove('optimizing');
        button.disabled = false;
    }, 500);
}

function displayResults(steps, finalReg422, finalReg423) {
    const resultArea = document.getElementById('result-area');
    const stepsContainer = document.getElementById('steps-container');
    const summaryContainer = document.getElementById('summary-container');

    // ステップを表示
    stepsContainer.innerHTML = '';

    for (const step of steps) {
        const stepDiv = document.createElement('div');
        stepDiv.className = 'step';

        let detailsHtml = '';
        if (typeof step.details === 'object' && step.details !== null) {
            for (const [key, value] of Object.entries(step.details)) {
                detailsHtml += `<div>• ¥${key}: ${value}枚</div>`;
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

    // サマリーを非表示
    summaryContainer.innerHTML = '';

    resultArea.style.display = 'block';
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
