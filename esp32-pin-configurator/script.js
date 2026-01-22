document.addEventListener('DOMContentLoaded', () => {
    const tooltip = document.getElementById('tooltip');
    const pinDetails = document.getElementById('pin-details');
    const UNCONFIGURABLE_PINS = ["GND", "VIN", "3.3V", "ENABLE"];
    const pinConfigs = {}; // key = pin name, value = config object

    let selectedPin = null;
    let selectedMode = null;
    let selectedFunction = null;

    // Step 2 options by mode
    const step2Options = {
        input: [
            { value: 'adc', label: 'ADC', desc: 'Analog to Digital Conversion' },
            { value: 'gpio', label: 'GPIO Read', desc: 'Read digital values' },
            { value: 'dac', label: 'DAC', desc: 'Digital to Analog Conversion' }
        ],
        output: [
            { value: 'gpio', label: 'GPIO Write', desc: 'Send digital values' },
            { value: 'pwm', label: 'PWM', desc: 'Pulse Width Modulation' },
            { value: 'spi', label: 'SPI', desc: 'Serial Peripheral Interface' },
            { value: 'I2C', label: 'I2C', desc: 'Inter-Integrated Circuit' }
        ]
    };

    // Pin info
    const pinInfo = {
        "Pin 1 - Left side": { name: "ENABLE", type: "Input", description: "Enable or reset the pin", voltage: "3.3V", configurable: false },
        "Pin 2 - Left side": { name: "GPIO 36", type: "Input ADC", description: "Input Only for ADC pin used for analog input" },
        "Pin 3 - Left side": { name: "GPIO 39", type: "Input ADC", description: "VN - Input Only for ADC pin used for analog sensing." },
        "Pin 4 - Left side": { name: "GPIO 34", type: "Input ADC", description: "Input Only for ADC pin used for analog input" },
        "Pin 5 - Left side": { name: "GPIO 35", type: "Input ADC", description: "Input Only and supports ADC signals" },
        "Pin 6 - Left side": { name: "GPIO 32", type: "I/O ADC", description: "General purpose I/O and ADC input", functionality: "Better when Wi-fi is enabled" },
        "Pin 7 - Left side": { name: "GPIO 33", type: "I/O ADC", description: "General purpose I/O and ADC input", functionality: "Better when Wi-fi is enabled" },
        "Pin 8 - Left side": { name: "GPIO 25", type: "DAC", description: "Supports digital output and DAC output" },
        "Pin 9 - Left side": { name: "GPIO 26", type: "DAC", description: "Supports digital output and DAC output" },
        "Pin 10 - Left side": { name: "GPIO 27", type: "ADC", description: "General purpose I/O and ADC input" },
        "Pin 11 - Left side": { name: "GPIO 14", type: "I/O Touch", description: "Supports touch sensing and digital I/O" },
        "Pin 12 - Left side": { name: "GPIO 12", type: "I/O Touch", description: "Supports touch sensing and digital I/O" },
        "Pin 13 - Left side": { name: "GPIO 13", type: "I/O Touch", description: "Supports touch sensing and digital I/O" },
        "Pin 14 - Left side": { name: "GND", type: "Ground", description: "Ground connection", configurable: false },
        "Pin 15 - Left side": { name: "VIN", type: "Power", voltage: "5V", configurable: false },

        "Pin 1 - Right side": { name: "GPIO 23", type: "I/O", description: "General purpose I/O" },
        "Pin 2 - Right side": { name: "GPIO 22", type: "I/O", description: "General purpose I/O" },
        "Pin 3 - Right side": { name: "GPIO 1", type: "I/O UART", description: "TX0 - UART0 transmit pin and general-purpose I/O" },
        "Pin 4 - Right side": { name: "GPIO 3", type: "I/O", description: "RX0 - UART0 receive pin and general-purpose I/O" },
        "Pin 5 - Right side": { name: "GPIO 21", type: "I/O", description: "General purpose I/O" },
        "Pin 6 - Right side": { name: "GPIO 19", type: "I/O SPI", description: "Can be used as SPI MISO or general I/O" },
        "Pin 7 - Right side": { name: "GPIO 18", type: "I/O SPI", description: "Can be used as SPI clock (SCK) or general I/O" },
        "Pin 8 - Right side": { name: "GPIO 5", type: "I/O", description: "General purpose I/O" },
        "Pin 9 - Right side": { name: "GPIO 17", type: "I/O", description: "General purpose I/O" },
        "Pin 10 - Right side": { name: "GPIO 16", type: "I/O", description: "General purpose I/O" },
        "Pin 11 - Right side": { name: "GPIO 4", type: "I/O", description: "General purpose I/O" },
        "Pin 12 - Right side": { name: "GPIO 2", type: "I/O", description: "General purpose I/O" },
        "Pin 13 - Right side": { name: "GPIO 15", type: "I/O", description: "General purpose I/O" },
        "Pin 14 - Right side": { name: "GND", type: "Ground", description: "Ground connection", configurable: false },
        "Pin 15 - Right side": { name: "3.3V", type: "Power", voltage: "3.3V", configurable: false }
    };

    function renderPinDetails(pinData) {
        if (!pinData) {
            pinDetails.innerHTML = '<p>No information available.</p>';
            return;
        }
        pinDetails.innerHTML = `
            <div class="pin-detail">
                <h3>${pinData.name}</h3>
                <p><strong>Type:</strong> ${pinData.type || 'N/A'}</p>
                ${pinData.description ? `<p><strong>Description:</strong> ${pinData.description}</p>` : ""}
                ${pinData.voltage ? `<p><strong>Voltage:</strong> ${pinData.voltage}</p>` : ""}
            </div>
        `;
    }

    function showTooltip(pinData, e) {
        let html = `<h3>${pinData?.name || 'Unknown Pin'}</h3>`;
        if (pinData?.description) html += `<p>${pinData.description}</p>`;
        if (pinData?.voltage) html += `<p><strong>Voltage:</strong> ${pinData.voltage}</p>`;
        tooltip.innerHTML = html;
        tooltip.style.display = 'block';
        moveTooltip(e);
    }
    function hideTooltip() { tooltip.style.display = 'none'; }
    function moveTooltip(e) {
        tooltip.style.left = e.pageX + 10 + 'px';
        tooltip.style.top = e.pageY - 30 + 'px';
    }

    function showStep2(mode) {
        const step2 = document.getElementById('step2');
        step2.innerHTML = ''; // Clear old options
        step2Options[mode].forEach(opt => {
            const div = document.createElement('div');
            div.classList.add('option-box');
            div.dataset.step = "2";
            div.dataset.value = opt.value;
            div.innerHTML = `<h3>${opt.label}</h3><p>${opt.desc}</p>`;
            step2.appendChild(div);
        });
        step2.style.display = 'block';
    }

    function selectPin(el) {
        document.querySelectorAll('.pin').forEach(p => p.classList.remove('selected'));
        el.classList.add('selected');
        selectedPin = pinInfo[el.dataset.tooltip];
        renderPinDetails(selectedPin);

        const savedConfig = pinConfigs[selectedPin.name];
        if (savedConfig) {
            selectedMode = savedConfig.mode;
            selectedFunction = savedConfig.function;
            showStep2(savedConfig.mode);
            document.getElementById('step3').style.display = 'block';
            document.querySelectorAll('[data-step="1"]').forEach(box => {
                box.classList.toggle('selected', box.dataset.value === savedConfig.mode);
            });
            document.querySelectorAll('[data-step="2"]').forEach(box => {
                box.classList.toggle('selected', box.dataset.value === savedConfig.function);
            });
            renderConfigOptions(savedConfig.function);
        } else {
            resetSteps();
        }
    }

    function resetSteps() {
        selectedMode = null;
        selectedFunction = null;
        document.getElementById('step2').style.display = 'none';
        document.getElementById('step3').style.display = 'none';
        document.getElementById('config-area').innerHTML = '';
    }

    function savePWMParam(param, value) {
        if (!pinConfigs[selectedPin.name]) {
            pinConfigs[selectedPin.name] = { mode: selectedMode, function: selectedFunction };
        }
        pinConfigs[selectedPin.name][param] = value;
        console.log("PWM config saved:", pinConfigs[selectedPin.name]);
    }

    function renderConfigOptions(func) {
        const configArea = document.getElementById('config-area');
        switch (func) {
            case 'adc':
                configArea.innerHTML = `<p>ADC: Reading data</p>`;
                break;

            case 'pwm':
                configArea.innerHTML = `
                    <label>Frequency: <input type="number" id="pwmFreq" min="1" max="100000" step="1" placeholder="Hz"></label><br>
                    <label>Duty Cycle (%): <input type="number" id="pwmDuty" min="0" max="100" step="0.1" placeholder="0-100"></label><br>
                    <label>Phase (°): <input type="number" id="pwmPhase" min="0" max="360" step="1" placeholder="0-360"></label><br>
                    <label>Deadband (µs): <input type="number" id="pwmDead" min="0" max="255" step="1" placeholder="0-255"></label>
                `;
                function sendPWMUpdate(param, value) {
                    if (isNaN(value)) return;
                    console.log(`PWM ${param} set to`, value);
                }
                document.getElementById('pwmFreq').addEventListener('input', e => {
                    let val = Math.max(1, Math.min(100000, parseInt(e.target.value, 10)));
                    sendPWMUpdate("frequency", val);
                    savePWMParam("frequency", val);
                });
                document.getElementById('pwmDuty').addEventListener('input', e => {
                    let val = Math.max(0, Math.min(100, parseFloat(e.target.value)));
                    sendPWMUpdate("duty cycle", val);
                    savePWMParam("dutyCycle", val);
                });
                document.getElementById('pwmPhase').addEventListener('input', e => {
                    let val = Math.max(0, Math.min(360, parseInt(e.target.value, 10)));
                    sendPWMUpdate("phase", val);
                    savePWMParam("phase", val);
                });
                document.getElementById('pwmDead').addEventListener('input', e => {
                    let val = Math.max(0, Math.min(1000, parseInt(e.target.value, 10)));
                    sendPWMUpdate("deadband", val);
                    savePWMParam("deadband", val);
                });
                if (pinConfigs[selectedPin.name]) {
                    document.getElementById('pwmFreq').value = pinConfigs[selectedPin.name].frequency || '';
                    document.getElementById('pwmDuty').value = pinConfigs[selectedPin.name].dutyCycle || '';
                    document.getElementById('pwmPhase').value = pinConfigs[selectedPin.name].phase || '';
                    document.getElementById('pwmDead').value = pinConfigs[selectedPin.name].deadband || '';
                }
                break;

            case 'dac':
                configArea.innerHTML = `
                    <label for="dacValue">DAC Value:</label>
                    <input type="number" id="dacValue" min="0" max="4095" step="1" placeholder="0-4095">
                `;
                const dacInput = document.getElementById('dacValue');
                dacInput.addEventListener('input', () => {
                    let val = Math.max(0, Math.min(4095, parseInt(dacInput.value, 10)));
                    if (!pinConfigs[selectedPin.name]) {
                        pinConfigs[selectedPin.name] = { mode: selectedMode, function: selectedFunction };
                    }
                    pinConfigs[selectedPin.name].dacValue = val;
                    console.log("Setting DAC to", val);
                });
                if (pinConfigs[selectedPin.name]) {
                    document.getElementById('dacValue').value = pinConfigs[selectedPin.name].dacValue || '';
                }
                break;

            case 'gpio':
                configArea.innerHTML = `
                    <button>Read</button>
                    <button>Write High</button>
                    <button>Write Low</button>
                `;
                break;
        }
    }

    document.addEventListener('mouseover', e => {
        if (e.target.classList.contains('pin')) {
            showTooltip(pinInfo[e.target.dataset.tooltip], e);
        }
    });
    document.addEventListener('mousemove', e => {
        if (e.target.classList.contains('pin')) moveTooltip(e);
    });
    document.addEventListener('mouseout', e => {
        if (e.target.classList.contains('pin')) hideTooltip();
    });

    document.addEventListener('click', e => {
        if (e.target.classList.contains('pin')) selectPin(e.target);

        if (e.target.closest('.option-box')) {
            const box = e.target.closest('.option-box');
            const step = box.dataset.step;
            const value = box.dataset.value;

            if (!selectedPin) return alert("Please select a pin first");
            if (selectedPin.configurable === false || UNCONFIGURABLE_PINS.includes(selectedPin.name)) {
                return alert(`${selectedPin.name} pins cannot be configured`);
            }

            if (step === "1") {
                selectedMode = value;
                showStep2(value);
            }
            else if (step === "2") {
                selectedFunction = value;
                document.getElementById('step3').style.display = 'block';
                renderConfigOptions(value);

                // Mark this pin as configured
                const pinElement = document.querySelector(`.pin[data-tooltip="${Object.keys(pinInfo).find(key => pinInfo[key] === selectedPin)}"]`);
                if (pinElement) {
                    pinElement.classList.add('configured-pin');
                }

                // Save config
                if (!pinConfigs[selectedPin.name]) {
                    pinConfigs[selectedPin.name] = {};
                }
                pinConfigs[selectedPin.name].mode = selectedMode;
                pinConfigs[selectedPin.name].function = selectedFunction;
            }
        }
    });

    document.getElementById('resetButton').addEventListener('click', () => {
        for (const pinName in pinConfigs) {
            delete pinConfigs[pinName];
        }
        document.querySelectorAll('.pin').forEach(p => p.classList.remove('selected', 'configured-pin'));
        document.querySelectorAll('.option-box').forEach(box => box.classList.remove('selected'));
        resetSteps();
        pinDetails.innerHTML = '<p>Select a pin to view details</p>';
        selectedPin = null;
        selectedMode = null;
        selectedFunction = null;
        console.log("All pin configurations have been reset");
    });

});
